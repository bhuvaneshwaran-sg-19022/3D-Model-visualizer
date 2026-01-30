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
        
        this.currentHDRITexture = null;
        this.currentEnvMapRenderTarget = null;
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
                
                this.updateEnvironment(b, i);
            }   
        );
    }

    updateEnvironment(blurriness, intensity) {
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
}

window.EnvironmentManager = EnvironmentManager;
