import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelViewer {
    constructor() {
        this.container = document.getElementById('viewer-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentModel = null;
        this.gridHelper = null;
        this.wireframeMode = false;
        this.originalMaterials = new Map();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 10, 5);
        this.scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, -10, -5);
        this.scene.add(directionalLight2);
        
        // Grid
        this.gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        this.scene.add(this.gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Reset camera button
        document.getElementById('resetCamera').addEventListener('click', () => {
            this.resetCamera();
        });
        
        // Wireframe toggle
        document.getElementById('toggleWireframe').addEventListener('click', () => {
            this.toggleWireframe();
        });
        
        // Grid toggle
        document.getElementById('toggleGrid').addEventListener('click', () => {
            this.toggleGrid();
        });
        
        // Background color
        document.getElementById('bgColor').addEventListener('input', (e) => {
            this.scene.background = new THREE.Color(e.target.value);
        });
        
        // Drag and drop
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.container.classList.add('drag-over');
        });
        
        this.container.addEventListener('dragleave', () => {
            this.container.classList.remove('drag-over');
        });
        
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.container.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this.loadModelFromFile(file);
            }
        });
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadModelFromFile(file);
        }
    }
    
    loadModelFromFile(file) {
        const fileName = file.name.toLowerCase();
        const loading = document.getElementById('loading');
        const info = document.getElementById('info');
        
        loading.classList.remove('hidden');
        info.classList.add('hidden');
        
        // Remove previous model and clear materials map
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
        }
        this.originalMaterials.clear();
        this.wireframeMode = false;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (fileName.endsWith('.obj')) {
                    this.loadOBJ(e.target.result);
                } else if (fileName.endsWith('.stl')) {
                    this.loadSTL(e.target.result);
                } else if (fileName.endsWith('.gltf') || fileName.endsWith('.glb')) {
                    this.loadGLTF(e.target.result, fileName.endsWith('.glb'));
                } else {
                    this.showError('Unsupported file format. Please use .obj, .stl, .gltf, or .glb files.');
                    loading.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error loading model:', error);
                this.showError('Error loading model. Please check the file format.');
                loading.classList.add('hidden');
            }
        };
        
        if (fileName.endsWith('.glb') || fileName.endsWith('.stl')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }
    
    loadOBJ(data) {
        const loader = new OBJLoader();
        const object = loader.parse(data);
        
        // Apply default material to OBJ models that don't have materials
        object.traverse((child) => {
            if (child.isMesh && !child.material) {
                child.material = new THREE.MeshPhongMaterial({
                    color: 0x888888,
                    specular: 0x111111,
                    shininess: 200
                });
            }
        });
        
        this.setupModel(object);
    }
    
    loadSTL(data) {
        const loader = new STLLoader();
        const geometry = loader.parse(data);
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            specular: 0x111111,
            shininess: 200
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        this.setupModel(mesh);
    }
    
    loadGLTF(data, isBinary) {
        const loader = new GLTFLoader();
        const loading = document.getElementById('loading');
        
        loader.parse(data, '', 
            (gltf) => {
                this.setupModel(gltf.scene);
            },
            (error) => {
                console.error('Error parsing GLTF:', error);
                this.showError('Error loading GLTF model. Please check the file format.');
                loading.classList.add('hidden');
            }
        );
    }
    
    setupModel(model) {
        this.currentModel = model;
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDim;
        model.scale.multiplyScalar(scale);
        
        this.scene.add(model);
        
        // Update stats
        this.updateStats(model, size, scale);
        
        // Hide loading, keep info hidden
        document.getElementById('loading').classList.add('hidden');
        
        // Reset camera
        this.resetCamera();
    }
    
    updateStats(model, originalSize, scale) {
        const stats = document.getElementById('stats');
        const statsContent = document.getElementById('statsContent');
        
        let vertices = 0;
        let faces = 0;
        
        model.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    const positions = child.geometry.attributes.position;
                    if (positions) {
                        vertices += positions.count;
                    }
                    if (child.geometry.index) {
                        faces += child.geometry.index.count / 3;
                    } else if (positions) {
                        faces += positions.count / 3;
                    }
                }
            }
        });
        
        statsContent.innerHTML = `
            <div><strong>Vertices:</strong> ${vertices.toLocaleString()}</div>
            <div><strong>Faces:</strong> ${Math.floor(faces).toLocaleString()}</div>
            <div><strong>Original Size:</strong> ${originalSize.x.toFixed(2)} × ${originalSize.y.toFixed(2)} × ${originalSize.z.toFixed(2)}</div>
            <div><strong>Scale Factor:</strong> ${scale.toFixed(4)}</div>
        `;
        
        stats.classList.remove('hidden');
    }
    
    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        
        if (this.currentModel) {
            // Create a single wireframe material to reuse
            if (!this.wireframeMaterial) {
                this.wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    wireframe: true
                });
            }
            
            this.currentModel.traverse((child) => {
                if (child.isMesh) {
                    if (this.wireframeMode) {
                        // Store original material
                        this.originalMaterials.set(child, child.material);
                        // Apply wireframe material
                        child.material = this.wireframeMaterial;
                    } else {
                        // Restore original material
                        const original = this.originalMaterials.get(child);
                        if (original) {
                            child.material = original;
                            this.originalMaterials.delete(child);
                        }
                    }
                }
            });
        }
    }
    
    toggleGrid() {
        this.gridHelper.visible = !this.gridHelper.visible;
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    showError(message) {
        const info = document.getElementById('info');
        info.innerHTML = `<p style="color: #ff6b6b;">❌ ${message}</p>`;
        info.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            info.innerHTML = `
                <p>Drag and drop a 3D model file (.obj, .stl, .gltf, .glb) or use the Load button</p>
                <p>Controls: Left click + drag to rotate | Right click + drag to pan | Scroll to zoom</p>
            `;
        }, 5000);
    }
}

// Initialize viewer - DOM is guaranteed to be ready with ES6 modules
new ModelViewer();
