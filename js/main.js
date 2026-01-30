class ThreeDViewer {
    constructor(config) {
        this.config = config;
        this.sceneManager = new SceneManager(config);
        this.envManager = new EnvironmentManager(this.sceneManager.scene, this.sceneManager.renderer);
        this.lightingManager = new LightingManager(this.sceneManager.scene);
        this.animationManager = new AnimationManager();
        
        // Pass a callback to ModelManager if we want to handle animations automatically
        this.modelManager = new ModelManager(this.sceneManager.scene, config);
        
        // Setup initial model if URL exists
        if (config.url) {
            this.modelManager.loadFromUrl(config.url, {
                onLoad: (gltf) => {
                    if (this.config.isAnimatable && gltf.animations && gltf.animations.length > 0) {
                        this.animationManager.setupAnimations(gltf.scene, gltf.animations);
                        // Play the first animation by default if animatable is true
                        this.animationManager.playAnimation(gltf.animations[0]);
                    }
                    
                    // If UI exists, update it
                    if (this.uiManager) {
                        this.uiManager.updateAnimationList(gltf.animations);
                        this.uiManager.updateModelInfo();
                    }
                }
            });
        }

        // Optionally init UI if elements exist
        if (document.getElementById('fileInput')) {
            this.uiManager = new UIManager(
                this.sceneManager, 
                this.lightingManager, 
                this.envManager, 
                this.modelManager,
                this.animationManager
            );
        }

        // Load default HDRI if needed, or from config if we add it later
        this.envManager.loadHDRI('./js/garden.hdr');

        this.renderFrame();
    }

    renderFrame() {
        requestAnimationFrame(() => this.renderFrame());
        
        if (this.config.isAnimatable) {
            this.animationManager.update();
        }
        this.sceneManager.render();
	}
	
}

// Library entry point
window.initThreeDViewer = function(config) {
    return new ThreeDViewer(config);
};

