# 3D Model Visualizer

A sophisticated, browser-based 3D model viewer allowing users to load, visualize, and inspect GLB/GLTF models with advanced lighting, environment, and camera controls. Built with Three.js.

## Features

### 3D Model Support
-   **Formats**: Supports `.glb` and `.gltf` file formats.
-   **Draco Compression**: Integrated Draco decoder for loading compressed meshes.
-   **Loading**: Load models via file upload or URL.
-   **Inspection**: Real-time display of model dimensions (Width, Height, Depth).

### Advanced Lighting System
Features a fully customizable 3-point lighting setup to showcase models perfectly:
-   **Ambient Light**: Base scene illumination.
-   **Key Light (Warm)**: Primary directional light source.
-   **Fill Light (Cool)**:  Secondary light to soften shadows.
-   **Accent Light (Purple)**: Rim lighting for depth.
-   **Controls**: Adjust Color, Intensity, and Position (X, Y, Z) for all lights.

### Environment & Rendering
-   **HDRI Support**: Load `.hdr` or `.exr` environment maps for realistic reflections and lighting.
-   **Customization**: Adjust environment blurriness and intensity.
-   **Helpers**: Toggleable Grid and Axes configuration (1 Unit Blocks).

### Camera Control
-   **Position**: Fine-tune Camera X, Y, Z coordinates.
-   **Targeting**: Adjust LookAt X, Y, Z coordinates.
-   **FOV**: Adjust Field of View.

### Animation
-   Automatically detects animations within the GLB file.
-   UI tab to list and play specific animation clips.

### Utilities
-   **Canvas Resizing**: Manually set the canvas width and height.
-   **Screenshot**: Download the current view as an image.
-   **Config Export**: "Copy Settings" button to copy the current configuration to clipboard (useful for developers saving states).

## Project Structure

```
.
├── index.html              # Main application entry point and UI structure
├── rgbeloader.js           # Loader for HDR environment maps
├── three.zscustom.js       # Bundled Three.js library with dependencies
├── draco/                  # Draco decoder binaries for compressed models
├── js/                     # Application logic modules
│   ├── main.js             # Application initialization and orchestration
│   ├── SceneManager.js     # Three.js scene, camera, and renderer setup
│   ├── ModelManager.js     # Model loading (GLB/GLTF) and manipulation
│   ├── LightingManager.js  # Management of the 3-point lighting system
│   ├── EnvironmentManager.js # HDRI environment loading and PMREM generation
│   ├── AnimationManager.js # Animation mixer and clip management
│   └── UIManager.js        # Handling UI events, tabs, and inputs
```

## Getting Started

### Prerequisites
-   A modern web browser with WebGL support (Chrome, Firefox, Safari, Edge).
-   A local web server (Recommended).
    -   *Note: Due to browser security restrictions (CORS), loading external textures or models directly from the file system without a server often fails.*

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```

2.  **Start a local server:**

    If you have Python installed:
    ```bash
    # Python 3
    python -m http.server 8000
    ```
    
    Or using Node.js `http-server`:
    ```bash
    npx http-server .
    ```

    Or using VS Code Live Server extension.

3.  **Open in Browser:**
    Navigate to `http://localhost:8000` (or the port specified by your server).

## Usage Guide

1.  **Load a Model**: Go to the **Model** tab and click "Choose File" to upload a local `.glb` file, or rely on the default loaded model.
2.  **Adjust Position**: Use the **Model Rotation** sliders to orient your object.
3.  **Lighting Setup**: Switch to the **Lighting** tab to change the mood. Try moving the Key Light to change shadow direction.
4.  **Environment**: Use the **Environment** tab to upload a custom HDR image for different reflections.
5.  **View**: Use the **Camera** tab to frame your shot perfectly or adjust the FOV for a dramatic effect.
6.  **Animations**: If your model has animations, find them in the **Animations** tab and click to play.

## Technologies Used

-   **[Three.js](https://threejs.org/)**: The core 3D library.
-   **Draco**: For geometry compression/decompression.
-   **Vanilla JavaScript**: Modular ES6 classes for application logic.

## License

[MIT License](LICENSE) (or appropriate license for your project)
