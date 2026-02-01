class ModelManager {
    constructor(scene, config) {
        const GLTFLoader = config.GLTFLoader;

        this.scene = scene;
        this.config = config;
        this.properties = config.modelProperties || {};
        
        // Setup Loaders
        this.loader = config.GLTFLoader || new ThreeBundle.GLTFLoader();
        
        // Ensure DRACO is configured
        // We look for DRACOLoader on ThreeBundle or Global
        const DRACOLoader = ThreeBundle.DRACOLoader || window.DRACOLoader;
        
        if (DRACOLoader) {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('./draco/');
            dracoLoader.preload(); // Preload WASM
            
            this.loader.setDRACOLoader(dracoLoader);
            console.log('DRACO loader configured with path: ./draco/');
        } else {
            console.warn('DRACOLoader definition not found in ThreeBundle or window');
        }

        this.currentFileName = config.id || 'model';
        this.model = null; // Re-adding initialization
        this.boxHelperVisible = false;
        
        // Removed auto-loading from constructor as it's now handled by the library/ThreeDViewer
        // to properly handle animations and callbacks.
    }

    createDefaultCube() {
        const THREE = ThreeBundle.THREE;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        this.model = new THREE.Mesh(geometry, material);
        this.applyModelProperties();
        this.scene.add(this.model);
    }

    applyModelProperties() {
        if (!this.model) return;
        const props = this.config.modelProperties || {};
        
        if (props.scale) {
            this.model.scale.set(props.scale.x, props.scale.y, props.scale.z);
        }
        
        if (props.rotate) {
            this.updateRotation(props.rotate.x, props.rotate.y, props.rotate.z);
        }
    }

    loadFromUrl(url, callbacks) {
        const THREE = ThreeBundle.THREE;
        callbacks = callbacks || {};
        const onLoad = callbacks.onLoad;
        const onError = callbacks.onError;

        this.loader.load(
            url,
            (gltf) => {
                if (this.model) {
                    this.scene.remove(this.model);
                }
                if (this.boxHelper) {
                    this.scene.remove(this.boxHelper);
                }
                
                this.model = gltf.scene;
                // Attach animations to the model so they're accessible
                this.model.animations = gltf.animations;
                
                this.scene.add(this.model);
                
                // If not interactable, maybe we want to center/scale it by default
                // But the user provided scale/rotation in config, so let's respect that
                this.applyModelProperties();

                // Ensure transformation is applied before calculating box
                this.model.updateMatrixWorld(true);

                this.boxHelper = new THREE.Box3Helper(new THREE.Box3().setFromObject(this.model), 0xff0000);
                this.boxHelper.visible = this.boxHelperVisible;
                this.scene.add(this.boxHelper);

                if (onLoad) onLoad(gltf);
            },
            undefined,
            (error) => {
                console.error('Error loading model from URL:', error);
                if (onError) onError(error);
            }
        );
    }

    loadModel(file, callbacks) {
        const THREE = ThreeBundle.THREE;
        callbacks = callbacks || {};
        const onStart = callbacks.onStart;
        const onProgress = callbacks.onProgress;
        const onLoad = callbacks.onLoad;
        const onError = callbacks.onError;
        
        const url = URL.createObjectURL(file);
        this.currentFileName = file.name.replace(/\.[^/.]+$/, '');
        
        if (onStart) onStart();

        this.loader.load(
            url,
            (gltf) => {
                // Remove old model
                if (this.model) {
                    this.scene.remove(this.model);
                }
                if (this.boxHelper) {
                    this.scene.remove(this.boxHelper);
                }
                
                this.model = gltf.scene;
                // Attach animations to the model so they're accessible
                this.model.animations = gltf.animations;
                
                this.scene.add(this.model);
                
                // Center and scale model
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                
                this.model.scale.multiplyScalar(scale);
                this.model.position.sub(center.multiplyScalar(scale));
                
                this.model.updateMatrixWorld(true);

                this.boxHelper = new THREE.Box3Helper(new THREE.Box3().setFromObject(this.model), 0xff0000);
                this.boxHelper.visible = this.boxHelperVisible;
                this.scene.add(this.boxHelper);
                
                URL.revokeObjectURL(url);

                if (onLoad) onLoad(gltf);
            },
            (progress) => {
                if (onProgress && progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    onProgress(percent);
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                URL.revokeObjectURL(url);
                if (onError) onError(error);
            }
        );
    }

    updateRotation(x, y, z) {
        const THREE = ThreeBundle.THREE;
        if (this.model) {
            this.model.rotation.x = THREE.MathUtils.degToRad(parseFloat(x));
            this.model.rotation.y = THREE.MathUtils.degToRad(parseFloat(y));
            this.model.rotation.z = THREE.MathUtils.degToRad(parseFloat(z));
        }
    }

    getCurrentFileName() {
        return this.currentFileName;
    }

    getModelDimensions() {
        const THREE = ThreeBundle.THREE;
        if (!this.model) return null;
        
        const box = new THREE.Box3().setFromObject(this.model);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        return {
            x: size.x.toFixed(4),
            y: size.y.toFixed(4),
            z: size.z.toFixed(4)
        };
    }

    toggleBoxHelper(visible) {
        this.boxHelperVisible = visible;
        if (this.boxHelper) {
            this.boxHelper.visible = visible;
        }
    }
}

window.ModelManager = ModelManager;
