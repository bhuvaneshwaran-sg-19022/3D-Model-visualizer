class AnimationManager {
    constructor() {
        const THREE = ThreeBundle.THREE;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.clips = [];
    }

    setupAnimations(model, animations) {
        const THREE = ThreeBundle.THREE;
        this.mixer = null;
        this.clips = animations || [];

        if (this.clips.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
        }
        
        return this.clips;
    }

    playAnimation(clip) {
        if (this.mixer) {
            this.mixer.stopAllAction();
            const action = this.mixer.clipAction(clip);
            action.setEffectiveTimeScale(1);
            action.setEffectiveWeight(1);
            action.clampWhenFinished = true;
            action.reset();
            action.play();
        }
    }

    stopAll() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }

    update() {
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }
    }
}

window.AnimationManager = AnimationManager;
