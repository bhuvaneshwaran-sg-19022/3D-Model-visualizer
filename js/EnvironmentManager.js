class EnvironmentManager {
    constructor(scene, renderer) {
        const THREE = ThreeBundle.THREE;
        this.scene = scene;
        this.renderer = renderer;
        
        // Note: RGBELoader is typically an add-on in Three.js. 
        // We check ThreeBundle, then THREE, then window for it.
        const RGBELoader = ThreeBundle.RGBELoader || THREE.RGBELoader || window.RGBELoader;
        
        this.rgbeLoader = RGBELoader ? new RGBELoader() : null;
        
        if (!this.rgbeLoader) {
            console.error('RGBELoader not found! HDRI loading is disabled. Please include RGBELoader.js.');
        }

        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        this.currentType = 'none'; // 'room' | 'sky' | 'hdri' | 'none'
        this.currentHDRITexture = null;
        this.currentEnvMapRenderTarget = null;

        // Built-in procedural presets (RoomEnvironment.js / Sky.js, loaded as plain globals like RGBELoader).
        this.roomEnvironment = window.RoomEnvironment ? new window.RoomEnvironment() : null;
        this.sky = window.Sky ? new window.Sky() : null;
        this.sunVersion = 0; // bumped whenever the sun direction changes, so other GL contexts know to rebake
        if (this.sky) {
            this.sky.scale.setScalar(450000);
            this._sunVector = new THREE.Vector3();
            this.setSunPosition(20, 180, { skipApply: true });
        }

        // Default to the neutral studio environment so models are lit out of the box.
        this.setEnvironmentType('room', 1);
    }

    // Switches between the built-in procedural presets ('room', 'sky') or clears the environment ('none').
    // 'hdri' is set separately via loadHDRI() since it requires a file to be loaded first.
    setEnvironmentType(type, intensity) {
        const i = intensity !== undefined ? intensity : 1;

        if (type === 'room' && this.roomEnvironment) {
            this.currentType = 'room';
            this.bakeEnvironment(this.roomEnvironment, i);
        } else if (type === 'sky' && this.sky) {
            this.currentType = 'sky';
            this.bakeSky(i);
        } else if (type === 'hdri') {
            // Nothing to bake without a texture; caller should use loadHDRI() instead.
            this.currentType = 'hdri';
        } else {
            this.currentType = 'none';
            this.clearEnvironment(i);
        }
    }

    // Updates the sun direction used by the procedural Sky preset (elevation/azimuth in degrees).
    setSunPosition(elevation, azimuth, options) {
        if (!this.sky) return;
        const THREE = ThreeBundle.THREE;

        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = 10;
        uniforms['rayleigh'].value = 2;
        uniforms['mieCoefficient'].value = 0.005;
        uniforms['mieDirectionalG'].value = 0.8;

        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        this._sunVector.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(this._sunVector);
        this.sunVersion++;

        if (!options?.skipApply && this.currentType === 'sky') {
            this.bakeSky(this.scene.environmentIntensity ?? 1);
        }
    }

    // A PMREM render target only lives in the GPU memory of the context that generated it,
    // so renderers other than the main one (e.g. the presets preview/offscreen renderers)
    // need to bake their own copy of the active preset using their own PMREMGenerator.
    bakeEnvironmentForRenderer(pmremGenerator) {
        const THREE = ThreeBundle.THREE;
        if (this.currentType === 'room' && this.roomEnvironment) {
            return pmremGenerator.fromScene(this.roomEnvironment, 0);
        }
        if (this.currentType === 'sky' && this.sky) {
            const tempScene = new THREE.Scene();
            tempScene.add(this.sky);
            return pmremGenerator.fromScene(tempScene, 0);
        }
        if (this.currentType === 'hdri' && this.currentHDRITexture) {
            return pmremGenerator.fromEquirectangular(this.currentHDRITexture);
        }
        return null;
    }

    // Identity/version to compare against so callers know when their cached bake is stale.
    getEnvironmentSourceRef() {
        if (this.currentType === 'hdri') return this.currentHDRITexture;
        if (this.currentType === 'sky') return this.sunVersion;
        if (this.currentType === 'room') return this.roomEnvironment;
        return null;
    }

    bakeSky(intensity) {
        if (!this.sky) return;
        const THREE = ThreeBundle.THREE;
        const tempScene = new THREE.Scene();
        tempScene.add(this.sky);
        this.bakeEnvironment(tempScene, intensity);
    }

    loadHDRI(path, blurriness, intensity) {
        if (!this.rgbeLoader) return;
        
        const THREE = ThreeBundle.THREE;
        const b = blurriness !== undefined ? blurriness : 0;
        const i = intensity !== undefined ? intensity : 1;

        this.rgbeLoader.load(
            path,
            (texture) => {
                if (this.currentHDRITexture) this.currentHDRITexture.dispose();
                this.currentHDRITexture = texture;
                this.currentHDRITexture.mapping = THREE.EquirectangularReflectionMapping;
                this.currentType = 'hdri';
                
                this.updateEnvironment(b, i);
            }   
        );
    }

    // Central update entrypoint driven by the Blur/Intensity sliders; behavior depends on currentType.
    // Blurriness only applies to the custom HDRI preset (it blurs the baked reflection map).
    updateEnvironment(blurriness, intensity) {
        if (this.currentType === 'hdri') {
            this.updateHDRIEnvironment(blurriness, intensity);
        } else if ('environmentIntensity' in this.scene) {
            // Room/Sky/None: PMREM is already baked, intensity is just a scalar multiplier.
            this.scene.environmentIntensity = intensity;
        }
    }

    updateHDRIEnvironment(blurriness, intensity) {
        if (!this.currentHDRITexture) return;

        const THREE = ThreeBundle.THREE;
        try {
            // Update intensity
            if ('environmentIntensity' in this.scene) {
                this.scene.environmentIntensity = intensity;
            }

            // Avoid updating if values haven't changed significantly to prevent thrashing
            if (this.currentEnvMapRenderTarget && 
                this.currentEnvMapRenderTarget.blurriness === blurriness && 
                Math.abs(this.scene.environmentIntensity - intensity) < 0.01) {
                return;
            }

            // Clear current render target binding
            this.renderer.setRenderTarget(null);

            // Handle blur using temp scene
            const tempScene = new THREE.Scene();
            tempScene.background = this.currentHDRITexture;
            tempScene.backgroundBlurriness = blurriness;

            // Generate PMREM
            const newEnvMapRenderTarget = this.pmremGenerator.fromScene(tempScene);
            newEnvMapRenderTarget.blurriness = blurriness; 
            
            // Update scene environment
            this.scene.environment = newEnvMapRenderTarget.texture;

            // Dispose old render target
            if (this.currentEnvMapRenderTarget) {
                this.currentEnvMapRenderTarget.dispose();
            }
            this.currentEnvMapRenderTarget = newEnvMapRenderTarget;
        } catch (error) {
            console.error("Error updating environment:", error);
        }
    }

    bakeEnvironment(sceneSource, intensity) {
        if (!sceneSource) return;
        try {
            if ('environmentIntensity' in this.scene) {
                this.scene.environmentIntensity = intensity;
            }

            this.renderer.setRenderTarget(null);

            const newEnvMapRenderTarget = this.pmremGenerator.fromScene(sceneSource, 0);
            this.scene.environment = newEnvMapRenderTarget.texture;

            if (this.currentEnvMapRenderTarget) {
                this.currentEnvMapRenderTarget.dispose();
            }
            this.currentEnvMapRenderTarget = newEnvMapRenderTarget;
        } catch (error) {
            console.error("Error baking environment:", error);
        }
    }

    clearEnvironment(intensity) {
        if ('environmentIntensity' in this.scene) {
            this.scene.environmentIntensity = intensity !== undefined ? intensity : 1;
        }
        this.scene.environment = null;
        if (this.currentEnvMapRenderTarget) {
            this.currentEnvMapRenderTarget.dispose();
            this.currentEnvMapRenderTarget = null;
        }
    }
}

window.EnvironmentManager = EnvironmentManager;
