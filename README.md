# 3D Model Visualizer

A web-based 3D model viewer that allows you to visualize and interact with 3D models directly in your browser.

## Features

- 🎨 **Multiple Format Support**: Load .OBJ, .STL, .GLTF, and .GLB files
- 🖱️ **Interactive Controls**: Rotate, pan, and zoom with mouse controls
- 🎯 **Drag & Drop**: Simply drag and drop your 3D model files
- 🔲 **Wireframe Mode**: Toggle between solid and wireframe rendering
- ⊞ **Grid Helper**: Show/hide reference grid
- 🎨 **Custom Background**: Change the background color
- 📊 **Model Statistics**: View vertex count, face count, and dimensions

## Live Demo

Visit the hosted version at: `https://bhuvaneshwaran-sg-19022.github.io/3D-Model-visualizer/`

## Usage

1. Open the webpage in your browser
2. Click "Load 3D Model" or drag and drop a model file
3. Use your mouse to interact with the model:
   - **Left click + drag**: Rotate the model
   - **Right click + drag**: Pan the view
   - **Scroll wheel**: Zoom in/out
4. Use the control buttons to:
   - Reset the camera view
   - Toggle wireframe mode
   - Show/hide the grid
   - Change background color

## Supported File Formats

- **.obj**: Wavefront OBJ format
- **.stl**: Stereolithography format
- **.gltf**: GL Transmission Format (JSON)
- **.glb**: GL Transmission Format (Binary)

## Local Development

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/bhuvaneshwaran-sg-19022/3D-Model-visualizer.git
   cd 3D-Model-visualizer
   ```

2. Start a local server (required for ES modules):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Technologies Used

- **Three.js**: 3D graphics library for WebGL
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Module-based architecture

## GitHub Pages Deployment

This project is configured to be hosted on GitHub Pages. To enable hosting:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Under "Source", select the branch you want to deploy (e.g., `main` or `copilot/host-static-webpage`)
4. Click "Save"
5. Your site will be published at `https://[username].github.io/3D-Model-visualizer/`

## License

This project is open source and available for anyone to use and modify.