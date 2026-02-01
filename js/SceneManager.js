class SceneManager {
    constructor(config) {
        const THREE = ThreeBundle.THREE;
        const TrackballControls = ThreeBundle.TrackballControls;

        this.parent = config.canvasParent || document.body;
        
        // If dimensions are provided in config, use them as initial size, 
        // but we will mainly rely on the parent container size for responsiveness 
        // if we are in a resonable container.
        this.width = config.dimension?.width || this.parent.clientWidth || 400;
        this.height = config.dimension?.height || this.parent.clientHeight || 400;
        
        // Create canvas if it doesn't exist
        this.canvas = document.createElement('canvas');
        this.parent.appendChild(this.canvas);

        // Bind dimension inputs
        this.widthInput = document.getElementById('canvas-width');
        this.heightInput = document.getElementById('canvas-height');
        
        if (this.widthInput && this.heightInput) {
            // Initial values
            this.widthInput.value = Math.round(this.width);
            this.heightInput.value = Math.round(this.height);

            // Listeners for manual input
            const updateSize = () => {
                const w = parseInt(this.widthInput.value) || 100;
                const h = parseInt(this.heightInput.value) || 100;
                this.parent.style.width = w + 'px';
                this.parent.style.height = h + 'px';
            };

            this.widthInput.addEventListener('change', updateSize);
            this.heightInput.addEventListener('change', updateSize);
            this.widthInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') updateSize(); });
            this.heightInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') updateSize(); });
        }
        
        // Scene setup
        this.scene = new THREE.Scene();

        // Camera config
        const cameraProps = config.modelProperties?.camera || {};
        const pos = cameraProps.position || { x: 0, y: 0, z: 5 };
        const lookAt = cameraProps.lookAt || { x: 0, y: 0, z: 0 };
        const projection = cameraProps.projection || { type: 'PERSPECTIVE', perspective: { fieldOfView: 45 } };

        if (projection.type === 'ORTHOGRAPHIC') {
            const aspect = this.width / this.height;
            const size = 5;
            this.camera = new THREE.OrthographicCamera(
                -size * aspect, size * aspect, size, -size, 0.1, 1000
            );
        } else {
            this.camera = new THREE.PerspectiveCamera(
                projection.perspective?.fieldOfView || 45, 
                this.width / this.height, 
                0.1, 
                1000
            );
        }

        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Helpers (Grid & Axes)
        this.helpers = new THREE.Group();
        this.helpers.visible = false; // Hidden by default
        
        // Grid: size 10, divisions 10 (so each square is 1x1 unit)
        const gridHelper = new THREE.GridHelper(10, 10);
        this.helpers.add(gridHelper);
        
        // Axes: Red=X, Green=Y, Blue=Z (length 5)
        const axesHelper = new THREE.AxesHelper(5);
        this.helpers.add(axesHelper);
        
        this.scene.add(this.helpers);

        // Trackball Controls
        if (config.isInteractable) {
            this.controls = new TrackballControls(this.camera, this.renderer.domElement);
            this.controls.target.set(lookAt.x, lookAt.y, lookAt.z);
            this.controls.noRotate = true; 
            this.controls.noPan = true;
            this.controls.staticMoving = true;
            this.controls.enabled = false;
            this.controls.update();
        }

        // Use ResizeObserver for more robust resizing (handles container resize, not just window)
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.parent);
        
        // Also keep window listener for good measure if parent depends on window
        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        const rect = this.parent.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Update inputs to reflect actual size (in case of drag resize)
        if (this.widthInput && this.heightInput) {
            // Check if active element to avoid interrupting typing
            if (document.activeElement !== this.widthInput) {
                this.widthInput.value = Math.round(width);
            }
            if (document.activeElement !== this.heightInput) {
                this.heightInput.value = Math.round(height);
            }
        }

        if (width > 0 && height > 0) {
            this.renderer.setSize(width, height);
            
            if (this.camera.isOrthographicCamera) {
                // Handle orthographic camera resize if needed
                // ... logic for ortho
            } else {
                this.camera.aspect = width / height;
            }
            this.camera.updateProjectionMatrix();
        }

        if (this.controls) {
            this.controls.handleResize();
        }
    }

    render() {
        this.controls?.update();
        this.renderer.render(this.scene, this.camera);
    }

    toggleHelpers(show) {
        if (this.helpers) {
            this.helpers.visible = show;
        }
    }

    getScreenshotBlob(callback) {
        const THREE = ThreeBundle.THREE;
        const currentSize = this.renderer.getSize(new THREE.Vector2());
        
        // Render at 1080x1080
        this.renderer.setSize(1080, 1080);
        this.camera.aspect = 1;
        this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.camera);
        
        // Get the image data
        this.canvas.toBlob((blob) => {
            // Restore original size
            this.renderer.setSize(currentSize.width, currentSize.height);
            this.onResize();
            this.render();
            
            if (callback) callback(blob);
        });
    }
}

window.SceneManager = SceneManager;
