class UIManager {
    constructor(sceneManager, lightingManager, envManager, modelManager, animationManager) {
        this.sceneManager = sceneManager;
        this.lightingManager = lightingManager;
        this.envManager = envManager;
        this.modelManager = modelManager;
        this.animationManager = animationManager;

        this.controls = this.getControls();
        this.numberInputs = {};
        this.loadingElement = document.getElementById('loading');
        this.animationListElement = document.getElementById('animationList');

        this.setupNumberInputs();
        this.setupEventListeners();
        this.setupTabSystem();
    }

    getControls() {
        return {
            envBlur: document.getElementById('envBlur'),
            envIntensity: document.getElementById('envIntensity'),
            rotX: document.getElementById('rotX'),
            rotY: document.getElementById('rotY'),
            rotZ: document.getElementById('rotZ'),
            camX: document.getElementById('camX'),
            camY: document.getElementById('camY'),
            camZ: document.getElementById('camZ'),
            lookX: document.getElementById('lookX'),
            lookY: document.getElementById('lookY'),
            lookZ: document.getElementById('lookZ'),
            fov: document.getElementById('fov'),
            ambientColor: document.getElementById('ambientColor'),
            ambientIntensity: document.getElementById('ambientIntensity'),
            light1Color: document.getElementById('light1Color'),
            light1Intensity: document.getElementById('light1Intensity'),
            light1X: document.getElementById('light1X'),
            light1Y: document.getElementById('light1Y'),
            light1Z: document.getElementById('light1Z'),
            light2Color: document.getElementById('light2Color'),
            light2Intensity: document.getElementById('light2Intensity'),
            light2X: document.getElementById('light2X'),
            light2Y: document.getElementById('light2Y'),
            light2Z: document.getElementById('light2Z'),
            light3Color: document.getElementById('light3Color'),
            light3Intensity: document.getElementById('light3Intensity'),
            light3X: document.getElementById('light3X'),
            light3Y: document.getElementById('light3Y'),
            light3Z: document.getElementById('light3Z')
        };
    }

    setupTabSystem() {
        window.openTab = function(evt, tabName) {
            const tabContents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }
            const tabs = document.getElementsByClassName('tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            document.getElementById(tabName).classList.add('active');
            evt.currentTarget.classList.add('active');
        };
    }

    setupNumberInputs() {
        Object.keys(this.controls).forEach(key => {
            const rangeInput = this.controls[key];
            if (!rangeInput || rangeInput.type !== 'range') return;

            const parent = rangeInput.parentNode;
            if (!parent) return;

            // Create container
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '10px';

            // Insert container before range input
            parent.insertBefore(container, rangeInput);

            // Move range input into container
            container.appendChild(rangeInput);

            // Create number input
            const numInput = document.createElement('input');
            numInput.type = 'number';
            numInput.id = key + '-input'; 
            numInput.value = rangeInput.value;
            numInput.step = rangeInput.step;
            numInput.min = rangeInput.min;
            if (rangeInput.max) numInput.max = rangeInput.max;
            
            // Inline styles to override CSS
            numInput.style.width = '60px';
            numInput.style.padding = '4px 2px';
            numInput.style.background = '#333';
            numInput.style.border = '1px solid #555';
            numInput.style.color = '#fff';
            numInput.style.borderRadius = '4px';
            numInput.style.fontSize = '12px';
            numInput.style.textAlign = 'center';

            // Styling adjustments for range input
            rangeInput.style.flex = '1';
            rangeInput.style.width = 'auto';

            container.appendChild(numInput);
            
            // Store reference
            this.numberInputs[key] = numInput;

            // Sync: Range -> Number (Immediate visual sync)
            rangeInput.addEventListener('input', () => {
                numInput.value = rangeInput.value;
            });

            // Sync: Number -> Range
            numInput.addEventListener('input', () => {
                let val = parseFloat(numInput.value);
                if (numInput.value === '') return;

                rangeInput.value = numInput.value;
                // Dispatch input event so other listeners fire
                rangeInput.dispatchEvent(new Event('input'));
                
                // For envBlur, the main listener is 'change', so dispatch that too if needed.
                // UIManager.js says: const eventType = (key === 'envBlur') ? 'change' : ...
                if (key === 'envBlur') {
                     rangeInput.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    setupEventListeners() {
        const safeListen = (id, event, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, callback);
        };

        // File Loader
        safeListen('fileInput', 'change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.modelManager.loadModel(file, {
                    onStart: () => {
                        if (this.loadingElement) {
                            this.loadingElement.style.display = 'block';
                            this.loadingElement.textContent = 'Loading model...';
                        }
                    },
                    onProgress: (percent) => {
                         if (this.loadingElement) this.loadingElement.textContent = 'Loading model... ' + percent + '%';
                    },
                    onLoad: (gltf) => {
                        if (this.loadingElement) this.loadingElement.style.display = 'none';
                        const animations = gltf.animations;
                        const clips = this.animationManager.setupAnimations(gltf.scene, animations);
                        this.updateAnimationList(clips);
                        this.updateModelInfo();
                        setTimeout(() => this.updateAll(false), 100);
                    },
                    onError: (error) => {
                        if (this.loadingElement) this.loadingElement.style.display = 'none';
                        alert('Error loading model: ' + error.message);
                    }
                });
            }
        });

        // Helpers Toggle
        safeListen('showHelpers', 'change', (event) => {
            this.sceneManager.toggleHelpers(event.target.checked);
        });

        // Box Helper Toggle
        safeListen('showBoxHelper', 'change', (event) => {
            this.modelManager.toggleBoxHelper(event.target.checked);
        });

        // Light Helper Toggle
        safeListen('showLightHelper', 'change', (event) => {
            this.lightingManager.toggleLightHelpers(event.target.checked);
        });

        // HDRI Loader
        safeListen('hdriInput', 'change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                this.envManager.loadHDRI(url, this.controls.envBlur?.value || 0, this.controls.envIntensity?.value || 1);
            }
        });

        // Copy Config
        safeListen('copyBtn', 'click', () => {
            this.copySettings();
        });

        // Download
        safeListen('downloadBtn', 'click', () => {
            const fileName = this.modelManager.getCurrentFileName();
            this.sceneManager.getScreenshotBlob((blob) => {
                 const url = URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = 'show-' + fileName + '.png';
                 link.click();
                 URL.revokeObjectURL(url);
            });
        });

        // Reset
        document.querySelectorAll('.resetBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                 this.resetControls();
            });
        });

        // All Inputs
        Object.keys(this.controls).forEach((key) => {
            const element = this.controls[key];
            if (!element) return;
            
            const eventType = (key === 'envBlur') ? 'change' : (element.type === 'color' ? 'input' : 'input');
            
            element.addEventListener(eventType, () => {
                this.updateDisplay(key, element.value);
                this.handleUpdate(key);
            });
        });
    }

    updateModelInfo() {
        const dims = this.modelManager.getModelDimensions();
        if (dims) {
            const xEl = document.getElementById('model-dim-x');
            const yEl = document.getElementById('model-dim-y');
            const zEl = document.getElementById('model-dim-z');
            if (xEl) xEl.textContent = dims.x;
            if (yEl) yEl.textContent = dims.y;
            if (zEl) zEl.textContent = dims.z;
        }
    }

    updateAnimationList(clips) {
        this.animationListElement.innerHTML = '';
        
        if (clips && clips.length > 0) {
            // Add stop button
            const stopBtn = document.createElement('button');
            stopBtn.textContent = 'Stop Animation';
            stopBtn.style.backgroundColor = '#d32f2f';
            stopBtn.style.marginBottom = '15px';
            stopBtn.onclick = () => {
                this.animationManager.stopAll();
                this.clearAnimationHighlights();
            };
            this.animationListElement.appendChild(stopBtn);

            // Add animation buttons
            clips.forEach((clip, index) => {
                const btn = document.createElement('button');
                btn.textContent = clip.name || ('Animation ' + (index + 1));
                btn.style.marginBottom = '5px';
                btn.className = 'tab';
                btn.style.width = '100%';
                btn.style.textAlign = 'left';
                btn.style.padding = '10px';
                btn.style.border = '1px solid #444';

                btn.onclick = () => {
                    this.animationManager.playAnimation(clip);
                    this.highlightAnimationButton(btn);
                };
                this.animationListElement.appendChild(btn);
            });
        } else {
            this.animationListElement.innerHTML = '<p style="color: #888; font-size: 14px;">No animations found in this model.</p>';
        }
    }

    highlightAnimationButton(activeBtn) {
        const allBtns = this.animationListElement.getElementsByTagName('button');
        for (let i = 0; i < allBtns.length; i++) {
            allBtns[i].style.backgroundColor = '';
        }
        activeBtn.style.backgroundColor = '#4CAF50';
    }

    copySettings() {
        const config = {
            modelProperties: {
                rotate: {
                    x: parseFloat(this.controls.rotX.value),
                    y: parseFloat(this.controls.rotY.value),
                    z: parseFloat(this.controls.rotZ.value)
                },
                camera: {
                    position: {
                        x: parseFloat(this.controls.camX.value),
                        y: parseFloat(this.controls.camY.value),
                        z: parseFloat(this.controls.camZ.value)
                    },
                    lookAt: {
                        x: parseFloat(this.controls.lookX.value),
                        y: parseFloat(this.controls.lookY.value),
                        z: parseFloat(this.controls.lookZ.value)
                    },
                    projection: {
                        type: 'PERSPECTIVE', 
                        perspective: {
                            fieldOfView: parseFloat(this.controls.fov.value)
                        }
                    }
                }
            },
            envSettings: {
                blur: parseFloat(this.controls.envBlur.value),
                intensity: parseFloat(this.controls.envIntensity.value)
            },
            lightingSettings: {
                ambient: {
                    color: this.controls.ambientColor.value,
                    intensity: parseFloat(this.controls.ambientIntensity.value)
                },
                lights: [
                    {
                        name: 'light1',
                        color: this.controls.light1Color.value,
                        intensity: parseFloat(this.controls.light1Intensity.value),
                        position: {
                            x: parseFloat(this.controls.light1X.value),
                            y: parseFloat(this.controls.light1Y.value),
                            z: parseFloat(this.controls.light1Z.value)
                        }
                    },
                    {
                        name: 'light2',
                        color: this.controls.light2Color.value,
                        intensity: parseFloat(this.controls.light2Intensity.value),
                        position: {
                            x: parseFloat(this.controls.light2X.value),
                            y: parseFloat(this.controls.light2Y.value),
                            z: parseFloat(this.controls.light2Z.value)
                        }
                    },
                    {
                        name: 'light3',
                        color: this.controls.light3Color.value,
                        intensity: parseFloat(this.controls.light3Intensity.value),
                        position: {
                            x: parseFloat(this.controls.light3X.value),
                            y: parseFloat(this.controls.light3Y.value),
                            z: parseFloat(this.controls.light3Z.value)
                        }
                    }
                ]
            }
        };

        const json = JSON.stringify(config, null, 4);
        navigator.clipboard.writeText(json).then(() => {
             const btn = document.getElementById('copyBtn');
             if (btn) {
                const originalContent = btn.innerHTML;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.innerHTML = originalContent, 2000);
             }
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Settings copied to console (clipboard failed)');
            console.log(json);
        });
    }

    clearAnimationHighlights() {
        const allBtns = this.animationListElement.querySelectorAll('button');
        for (let i = 0; i < allBtns.length; i++) {
             if (allBtns[i].textContent !== 'Stop Animation') {
                 allBtns[i].style.backgroundColor = '';
             }
        }
    }

    resetControls() {
        this.controls.envBlur.value = 0;
        this.controls.envIntensity.value = 1;
        this.controls.rotX.value = 0;
        this.controls.rotY.value = 0;
        this.controls.rotZ.value = 0;
        this.controls.camX.value = 0;
        this.controls.camY.value = 0;
        this.controls.camZ.value = 30;
        this.controls.lookX.value = 0;
        this.controls.lookY.value = 0;
        this.controls.lookZ.value = 0;
        this.controls.fov.value = 75;
        this.controls.ambientColor.value = '#ffffff';
        this.controls.ambientIntensity.value = 1.0;
        this.controls.light1Color.value = '#ffbf7f';
        this.controls.light1Intensity.value = 15;
        this.controls.light1X.value = 2.3;
        this.controls.light1Y.value = 2.7;
        this.controls.light1Z.value = 1.634;
        this.controls.light2Color.value = '#6699f2';
        this.controls.light2Intensity.value = 15;
        this.controls.light2X.value = -3.796;
        this.controls.light2Y.value = 5.113;
        this.controls.light2Z.value = 5.763;
        this.controls.light3Color.value = '#ddb9ff';
        this.controls.light3Intensity.value = 15;
        this.controls.light3X.value = -3.774;
        this.controls.light3Y.value = 5.806;
        this.controls.light3Z.value = -3.477;

        this.updateAll(true);
    }

    updateDisplay(key, value) {
        if (this.numberInputs && this.numberInputs[key]) {
            this.numberInputs[key].value = value;
        }
    }

    updateAll(updateDisplays) {
        const THREE = ThreeBundle.THREE;
        if (updateDisplays) {
            Object.keys(this.controls).forEach((key) => {
                this.updateDisplay(key, this.controls[key].value);
            });
        }

        this.modelManager.updateRotation(this.controls.rotX.value, this.controls.rotY.value, this.controls.rotZ.value);
        
        this.sceneManager.camera.position.set(parseFloat(this.controls.camX.value), parseFloat(this.controls.camY.value), parseFloat(this.controls.camZ.value));
        const lookAtCoord = new THREE.Vector3(parseFloat(this.controls.lookX.value), parseFloat(this.controls.lookY.value), parseFloat(this.controls.lookZ.value));
        
        if (this.sceneManager.controls) {
            this.sceneManager.controls.target.copy(lookAtCoord);
            this.sceneManager.controls.update(); // Force internal state sync
        } else {
            this.sceneManager.camera.lookAt(lookAtCoord);
        }
        
        this.sceneManager.camera.fov = parseFloat(this.controls.fov.value);
        this.sceneManager.camera.updateProjectionMatrix();

        this.lightingManager.updateAmbient(this.controls.ambientColor.value, this.controls.ambientIntensity.value);
        this.lightingManager.updateLight('light1', this.controls.light1Color.value, this.controls.light1Intensity.value, this.controls.light1X.value, this.controls.light1Y.value, this.controls.light1Z.value);
        this.lightingManager.updateLight('light2', this.controls.light2Color.value, this.controls.light2Intensity.value, this.controls.light2X.value, this.controls.light2Y.value, this.controls.light2Z.value);
        this.lightingManager.updateLight('light3', this.controls.light3Color.value, this.controls.light3Intensity.value, this.controls.light3X.value, this.controls.light3Y.value, this.controls.light3Z.value);

        this.envManager.updateEnvironment(parseFloat(this.controls.envBlur.value), parseFloat(this.controls.envIntensity.value));
    }

    handleUpdate(key) {
        const THREE = ThreeBundle.THREE;
        try {
            if (key.includes('rot')) {
                this.modelManager.updateRotation(this.controls.rotX.value, this.controls.rotY.value, this.controls.rotZ.value);
            } else if (key.includes('cam') || key.includes('look')) {
                 this.sceneManager.camera.position.set(parseFloat(this.controls.camX.value), parseFloat(this.controls.camY.value), parseFloat(this.controls.camZ.value));
                 const lookAtCoord = new THREE.Vector3(parseFloat(this.controls.lookX.value), parseFloat(this.controls.lookY.value), parseFloat(this.controls.lookZ.value));
                 
                 if (this.sceneManager.controls) {
                     this.sceneManager.controls.target.copy(lookAtCoord);
                     this.sceneManager.controls.update(); 
                 } else {
                     this.sceneManager.camera.lookAt(lookAtCoord);
                 }
            } else if (key === 'fov') {
                this.sceneManager.camera.fov = parseFloat(this.controls.fov.value);
                this.sceneManager.camera.updateProjectionMatrix();
            } else if (key.includes('ambient')) {
                this.lightingManager.updateAmbient(this.controls.ambientColor.value, this.controls.ambientIntensity.value);
            } else if (key.includes('light')) {
                if (key.includes('light1')) this.lightingManager.updateLight('light1', this.controls.light1Color.value, this.controls.light1Intensity.value, this.controls.light1X.value, this.controls.light1Y.value, this.controls.light1Z.value);
                if (key.includes('light2')) this.lightingManager.updateLight('light2', this.controls.light2Color.value, this.controls.light2Intensity.value, this.controls.light2X.value, this.controls.light2Y.value, this.controls.light2Z.value);
                if (key.includes('light3')) this.lightingManager.updateLight('light3', this.controls.light3Color.value, this.controls.light3Intensity.value, this.controls.light3X.value, this.controls.light3Y.value, this.controls.light3Z.value);
            } else if (key.includes('env')) {
                this.envManager.updateEnvironment(parseFloat(this.controls.envBlur.value), parseFloat(this.controls.envIntensity.value));
            }
        } catch (e) {
            console.error('Error updating settings:', e);
        }
    }
}

window.UIManager = UIManager;
