class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = {};
        this.helpers = {};
        this.helpersVisible = false;
        this.setupLights();
    }

    setupLights() {
        const THREE = ThreeBundle.THREE;
        // Ambient Light
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(this.lights.ambient);

        // Point Light 1 (Warm Key)
        this.lights.light1 = new THREE.PointLight(0xffbf7f, 15, 0);
        this.lights.light1.position.set(2.3, 2.7, 1.634);
        this.scene.add(this.lights.light1);
        
        this.helpers.light1 = new THREE.PointLightHelper(this.lights.light1, 0.2);
        this.helpers.light1.visible = this.helpersVisible;
        this.scene.add(this.helpers.light1);

        // Point Light 2 (Cool Fill)
        this.lights.light2 = new THREE.PointLight(0x6699f2, 15, 0);
        this.lights.light2.position.set(-3.796, 5.113, 5.763);
        this.scene.add(this.lights.light2);
        
        this.helpers.light2 = new THREE.PointLightHelper(this.lights.light2, 0.2);
        this.helpers.light2.visible = this.helpersVisible;
        this.scene.add(this.helpers.light2);

        // Point Light 3 (Purple Accent)
        this.lights.light3 = new THREE.PointLight(0xddb9ff, 15, 0);
        this.lights.light3.position.set(-3.774, 5.806, -3.477);
        this.scene.add(this.lights.light3);
        
        this.helpers.light3 = new THREE.PointLightHelper(this.lights.light3, 0.2);
        this.helpers.light3.visible = this.helpersVisible;
        this.scene.add(this.helpers.light3);
    }

    updateAmbient(color, intensity) {
        this.lights.ambient.color.set(color);
        this.lights.ambient.intensity = parseFloat(intensity);
    }

    updateLight(id, color, intensity, x, y, z) {
        const light = this.lights[id];
        const helper = this.helpers[id];
        
        if (light) {
            light.color.set(color);
            light.intensity = parseFloat(intensity);
            light.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
        }
        
        if (helper) {
            helper.update();
        }
    }

    toggleLightHelpers(visible) {
        this.helpersVisible = visible;
        for (const key in this.helpers) {
            if (this.helpers[key]) {
                this.helpers[key].visible = visible;
            }
        }
    }
}

window.LightingManager = LightingManager;
