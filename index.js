// DOM Elements
const shapeViewport = document.getElementById("shapeViewport");
const topOpenBtn = document.getElementById("topOpenBtn");
const leftOpenBtn = document.getElementById("leftOpenBtn");
const fileInput = document.getElementById("fileInput");

class ShapeRenderer {
    constructor(container) {
        this.container = container;
        this.shapes = [];
        this.meshes = [];

        // Initialize Three.js components
        this.initThreeJS();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.update();
    }

    initThreeJS() {
        // Create a scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf9f9f9);

        // Create an orthographic camera for 2D rendering
        const rect = this.container.getBoundingClientRect();
        this.viewportWidth = rect.width;
        this.viewportHeight = rect.height;
        this.camera = new THREE.OrthographicCamera(
            0, // left
            this.viewportWidth, // right
            this.viewportHeight, // top
            0, // bottom (flipped to match screen coordinates)
            1, // near
            1000 // far
        );
        this.camera.position.z = 100;

        // Create a renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.viewportWidth, this.viewportHeight);
        this.container.appendChild(this.renderer.domElement);
    }


    onWindowResize() {
        // Update viewport dimensions

        const rect = this.container.getBoundingClientRect();
        this.viewportWidth = rect.width;
        this.viewportHeight = rect.height;

        // Update camera projection
        this.camera.right = this.viewportWidth;
        this.camera.top = this.viewportHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(this.viewportWidth, this.viewportHeight);

        // Re-render all shapes with new dimensions
        this.render();
    }

    clear() {
        // Remove all shapes from the scene
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];
        this.shapes = [];
    }

    addShape(shapeData) {
        this.shapes.push(shapeData);
    }

    render() {
        // Clear previous meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];

        // Sort shapes by z-index before rendering
        this.shapes.sort((a, b) => a.zIndex - b.zIndex);

        // Render each shape
        this.shapes.forEach(shape => {
            if (shape.type === "Rectangle") {
                this.renderRectangle(shape);
            } else if (shape.type === "Triangle") {
                this.renderTriangle(shape);
            }
        });
    }

    renderRectangle(shapeData) {
        const { x, y, width, height, color, zIndex } = shapeData;

        // Create geometry and material
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            color: parseInt("0x" + color, 16) // Fix color parsing by adding 0x prefix
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Position at the center of the rectangle
        mesh.position.set(
            x + width / 2,
            this.viewportHeight - (y + height / 2), // Flip Y-coordinate for WebGL
            zIndex  // Use z-index for depth
        );

        // Add to scene and store reference
        this.scene.add(mesh);
        this.meshes.push(mesh);
    }

    renderTriangle(shapeData) {
        const { x, y, size, color, zIndex } = shapeData;

        // Create triangle geometry
        const geometry = new THREE.BufferGeometry();

        // Define vertices for a triangle with base at the bottom (point up)
        // Flip Y coordinates for WebGL coordinate system
        const vertices = new Float32Array([
            x + size / 2, this.viewportHeight - y, 0, // Top vertex
            x, this.viewportHeight - (y + size), 0, // Bottom left
            x + size, this.viewportHeight - (y + size), 0  // Bottom right
        ]);

        // Add vertices to geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: parseInt("0x" + color, 16), // Fix color parsing
            side: THREE.DoubleSide
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = zIndex; // Use z-index for depth

        // Add to scene and store reference
        this.scene.add(mesh);
        this.meshes.push(mesh);
    }

    update() {
        requestAnimationFrame(this.update.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

// File parser for custom .shapefile format, 
// handles "//" as comments, 
// return an array of objects with shape data
function parseShapeFile(fileContent) {
    const shapes = [];
    const lines = fileContent.split("\n");

    lines.forEach((line) => {
        // Remove comments and trim whitespace
        const commentIndex = line.indexOf("//");
        const cleanLine =
            commentIndex >= 0
                ? line.substring(0, commentIndex).trim()
                : line.trim();

        if (!cleanLine) return; // Skip empty lines

        // Parse shape definitions
        // Format: ShapeType, x, y, zIndex, [shapeSpecificParams], color;
        const shapeDefs = cleanLine.split(";");

        shapeDefs.forEach((shapeDef) => {
            if (!shapeDef.trim()) return;

            const parts = shapeDef.split(",").map((part) => part.trim());

            if (parts.length < 5) return; // Invalid shape definition

            const type = parts[0];
            const x = parseInt(parts[1]);
            const y = parseInt(parts[2]);
            const zIndex = parseInt(parts[3]);
            const color = parts[parts.length - 1];

            if (type === "Rectangle" && parts.length >= 6) {
                const width = parseInt(parts[4]);
                const height = parseInt(parts[5]);

                shapes.push({
                    type,
                    x,
                    y,
                    zIndex,
                    width,
                    height,
                    color,
                });
            } else if (type === "Triangle" && parts.length >= 5) {
                const size = parseInt(parts[4]); // Triangle size (height)

                shapes.push({
                    type,
                    x,
                    y,
                    zIndex,
                    size,
                    color,
                });
            }
        });
    });

    return shapes;
}

// Handle open file event and render to viewport
function openShapeFile(file) {
    const reader = new FileReader();

    reader.onload = function (event) {
        const content = event.target.result;
        const shapes = parseShapeFile(content);

        // Update UI to show the loaded file
        topOpenBtn.textContent = file.name;

        // Clear existing shapes and add new ones
        renderer.clear();
        shapes.forEach((shape) => renderer.addShape(shape));
        renderer.render();
    };

    reader.readAsText(file);
}

// Initialize Shape Renderer
const renderer = new ShapeRenderer(shapeViewport);

// Event listeners
topOpenBtn.addEventListener("click", () => fileInput.click());
leftOpenBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        openShapeFile(file);
    }
});