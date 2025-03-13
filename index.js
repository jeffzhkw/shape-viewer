// DOM Elements
const shapeViewport = document.getElementById("shapeViewport");
const topOpenBtn = document.getElementById("topOpenBtn");
const leftOpenBtn = document.getElementById("leftOpenBtn");
const fileInput = document.getElementById("fileInput");
const saveAsBtn = document.getElementById("saveAsBtn");

// Add Shape Controls
const addShapeBtn = document.getElementById("addShapeBtn");
const shapeModal = document.getElementById("shapeModal");
const cancelShapeBtn = document.getElementById("cancelShapeBtn");
// Shape Form Fields
const shapeForm = document.getElementById("shapeForm");
const shapeType = document.getElementById("shapeType");
const rectangleFields = document.getElementById("rectangleFields");
const triangleFields = document.getElementById("triangleFields");
const polygonFields = document.getElementById("polygonFields");
const shapeColor = document.getElementById("shapeColor");

class ShapeRenderer {
    constructor(container) {
        this.container = container;
        this.shapes = [];
        this.meshes = [];
        this.isDragging = false;
        this.selectedMesh = null;
        this.selectedShapeIndex = -1;
        this.dragOffset = { x: 0, y: 0 };

        // Initialize Three.js components
        this.initThreeJS();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Initialize raycaster for shape selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Add mouse event listeners
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

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
            } else if (shape.type === "Polygon") {
                this.renderPolygon(shape);
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
        const { x, y, width, height, color, zIndex } = shapeData;

        // Create triangle geometry
        const geometry = new THREE.BufferGeometry();

        // Define vertices for a triangle with base at the bottom (point up)
        // Flip Y coordinates for WebGL coordinate system
        const vertices = new Float32Array([
            x + width / 2, this.viewportHeight - y, 0,             // Top vertex
            x, this.viewportHeight - (y + height), 0,              // Bottom left
            x + width, this.viewportHeight - (y + height), 0       // Bottom right
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

    renderPolygon(shapeData) {
        const { x, y, points, color, zIndex } = shapeData;

        // Create a Three.js Shape
        const shape = new THREE.Shape();

        // Start from the first point
        if (points.length < 3) {
            alert("Polygon must have at least 3 points");
            return;
        }

        // start point
        shape.moveTo(points[0].x, points[0].y);

        // Draw line to subsequent points
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }

        // Close the shape by connecting back to the first point
        shape.closePath();

        // Create geometry from shape
        const geometry = new THREE.ShapeGeometry(shape);

        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: parseInt("0x" + color, 16),
            side: THREE.DoubleSide
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Position the mesh
        // For polygons we need to handle the position using the origin (x,y)
        // and transform the entire mesh to match the viewport coordinates
        mesh.position.set(x, this.viewportHeight - y, zIndex);

        // Flip the y-coordinates in the geometry
        for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
            geometry.attributes.position.array[i + 1] *= -1;
        }

        geometry.attributes.position.needsUpdate = true;

        // Add to scene and store reference
        this.scene.add(mesh);
        this.meshes.push(mesh);
    }

    // Convert viewport coordinates to normalized device coordinates
    getMouseNDC(event) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / this.viewportWidth) * 2 - 1,
            y: -((event.clientY - rect.top) / this.viewportHeight) * 2 + 1,
        };
    }

    // Convert screen coordinates to world coordinates (for dragging)
    getMouseWorldCoordinates(event) {
        const rect = this.container.getBoundingClientRect();
        // Convert viewport coordinates to Three.js coordinates (flip Y axis)
        return {
            x: event.clientX - rect.left,
            y: this.viewportHeight - (event.clientY - rect.top), // Flip Y for Three.js
        };
    }

    // Find the shape under the mouse cursor
    findIntersectedShape(event) {
        const mouseNDC = this.getMouseNDC(event);
        this.raycaster.setFromCamera(
            new THREE.Vector2(mouseNDC.x, mouseNDC.y),
            this.camera
        );

        const intersects = this.raycaster.intersectObjects(this.meshes);
        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const meshIndex = this.meshes.indexOf(intersectedMesh);
            return { mesh: intersectedMesh, index: meshIndex };
        }

        return { mesh: null, index: -1 };
    }

    onMouseDown(event) {
        if (event.button !== 0) return; // Only handle left mouse button

        const { mesh, index } = this.findIntersectedShape(event);

        if (mesh) {
            // Capture the shape and prepare for dragging
            this.isDragging = true;
            this.selectedMesh = mesh;
            this.selectedShapeIndex = index;

            // Calculate offset to prevent shape jumping to cursor position
            const mousePos = this.getMouseWorldCoordinates(event);

            // The same offset calculation works for all shape types
            // because we're using the mesh's position directly
            this.dragOffset = {
                x: mousePos.x - mesh.position.x,
                y: mousePos.y - mesh.position.y
            };
        }
    }

    onMouseMove(event) {
        if (!this.isDragging || this.selectedShapeIndex === -1) return;

        // Get current mouse position
        const mousePos = this.getMouseWorldCoordinates(event);

        // Calculate new position adjusting for the initial offset
        const newX = mousePos.x - this.dragOffset.x;
        const newY = mousePos.y - this.dragOffset.y;

        // Move the mesh
        this.selectedMesh.position.x = newX;
        this.selectedMesh.position.y = newY;

        // Update the shape data
        const shape = this.shapes[this.selectedShapeIndex];

        if (shape.type === "Rectangle") {
            // For rectangles, we need to update based on center position
            const { width, height } = shape;
            // Convert from Three.js position (center of rectangle) to viewport coordinates (top-left)
            shape.x = newX - width / 2;
            shape.y = this.viewportHeight - newY - height / 2;
        }
        else if (shape.type === "Triangle") {
            // For triangles - top vertex is at (x + size/2, y)
            const { width } = shape;
            shape.x = newX - width / 2;
            shape.y = this.viewportHeight - newY;
        }
        else if (shape.type === "Polygon") {
            // For polygons - origin is at (x, y)
            shape.x = newX;
            shape.y = this.viewportHeight - newY;
        }
    }

    onMouseUp() {
        // Reset dragging state
        this.isDragging = false;
        this.selectedMesh = null;
        this.selectedShapeIndex = -1;
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
            } else if (type === "Triangle" && parts.length >= 6) {
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
            } else if (type === "Polygon" && parts.length >= 5) {
                // Parse polygon points format: "x1:y1|x2:y2|x3:y3|..."
                const pointsString = parts[4];
                const pointPairs = pointsString.split("|");

                const points = pointPairs.map(pair => {
                    const [pointX, pointY] = pair.split(":").map(coord => parseInt(coord));
                    return { x: pointX, y: pointY };
                });

                shapes.push({
                    type,
                    x,
                    y,
                    zIndex,
                    points,
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


// Function to convert in memory shape to text file (.shapefile)
function shapesToFileContent(shapes) {
    let content = '';

    shapes.forEach(shape => {
        if (shape.type === "Rectangle") {
            content += `${shape.type}, ${shape.x}, ${shape.y}, ${shape.zIndex}, ${shape.width}, ${shape.height}, ${shape.color};\n`;
        } else if (shape.type === "Triangle") {
            content += `${shape.type}, ${shape.x}, ${shape.y}, ${shape.zIndex}, ${shape.width}, ${shape.height}, ${shape.color};\n`;
        } else if (shape.type === "Polygon") {
            // Convert points array to the format: "x1:y1|x2:y2|x3:y3|..."
            const pointsString = shape.points.map(p => `${p.x}:${p.y}`).join('|');
            content += `${shape.type}, ${shape.x}, ${shape.y}, ${shape.zIndex}, ${pointsString}, ${shape.color};\n`;
        }
    });

    return content;
}

// save/download action
function saveShapeFile() {
    // Get shapes from renderer
    const shapes = renderer.shapes;

    // If no shapes to save, alert the user
    if (shapes.length === 0) {
        alert("No shapes to save. Please open a shape file first.");
        return;
    }

    // Convert shapes to file content
    const content = shapesToFileContent(shapes);

    // Prompt user for filename
    const filename = prompt("Enter filename (without extension):", "shapes");

    // If user cancels, do nothing
    if (!filename) return;

    // Create a blob with the content
    const blob = new Blob([content], { type: 'text/plain' });

    // Create a download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.shapefile`;

    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the URL object
    URL.revokeObjectURL(a.href);
}

// Initialize Shape Renderer
const renderer = new ShapeRenderer(shapeViewport);

// Event listeners
topOpenBtn.addEventListener("click", () => fileInput.click());
leftOpenBtn.addEventListener("click", () => fileInput.click());
saveAsBtn.addEventListener("click", () => saveShapeFile());

// Add shapes
addShapeBtn.addEventListener("click", () => shapeModal.style.display = "block");
cancelShapeBtn.addEventListener("click", () => shapeModal.style.display = "none");

// Change visible fields based on selected shape type
shapeType.addEventListener("change", () => {
    const selectedType = shapeType.value;

    rectangleFields.style.display = "none";
    triangleFields.style.display = "none";
    polygonFields.style.display = "none";

    if (selectedType === "Rectangle") {
        rectangleFields.style.display = "block";
    } else if (selectedType === "Triangle") {
        triangleFields.style.display = "block";
    } else if (selectedType === "Polygon") {
        polygonFields.style.display = "block";
    }
});

// Handle form submission
shapeForm.addEventListener("submit", (event) => {
    event.preventDefault();


    const type = shapeType.value;
    const xVal = document.getElementById("shapeX").value;
    const yVal = document.getElementById("shapeY").value;
    const zIndexVal = document.getElementById("shapeZIndex").value;
    const colorVal = document.getElementById("shapeColor").value;


    if (!xVal || !yVal || !zIndexVal) {
        alert("Please enter X position, Y position, and Z-Index");
        return;
    }
    if (!colorVal || !/^[0-9A-Fa-f]{6}$/.test(colorVal)) {
        alert("Please enter a valid 6-digit hex color code without the # symbol");
        return;
    }

    // Parse validated values
    const x = parseInt(xVal);
    const y = parseInt(yVal);
    const zIndex = parseInt(zIndexVal);
    const color = colorVal;

    let newShape;

    // Validate shape-specific fields and create shape object
    if (type === "Rectangle") {
        const widthVal = document.getElementById("rectWidth").value;
        const heightVal = document.getElementById("rectHeight").value;

        if (!widthVal || !heightVal) {
            alert("Please enter width and height for the rectangle");
            return;
        }

        const width = parseInt(widthVal);
        const height = parseInt(heightVal);

        if (width <= 0 || height <= 0) {
            alert("Width and height must be greater than zero");
            return;
        }

        newShape = { type, x, y, zIndex, width, height, color };
    }
    else if (type === "Triangle") {
        const widthVal = document.getElementById("triangleWidth").value;
        const heightVal = document.getElementById("triangleHeight").value;

        if (!widthVal || !heightVal) {
            alert("Please enter width and height for the triangle");
            return;
        }

        const width = parseInt(widthVal);
        const height = parseInt(heightVal);

        if (width <= 0 || height <= 0) {
            alert("Width and height must be greater than zero");
            return;
        }

        newShape = { type, x, y, zIndex, width, height, color };
    }
    else if (type === "Polygon") {
        const pointsString = document.getElementById("polygonPoints").value;

        if (!pointsString) {
            alert("Please specify points for the polygon");
            return;
        }

        // Parse points from format "x1:y1|x2:y2|x3:y3"
        try {
            const pointPairs = pointsString.split("|");
            if (pointPairs.length < 3) {
                alert("A polygon must have at least 3 points");
                return;
            }

            const points = pointPairs.map(pair => {
                const [pointX, pointY] = pair.split(":").map(coord => parseInt(coord));
                if (isNaN(pointX) || isNaN(pointY)) {
                    throw new Error("Invalid point format");
                }
                return { x: pointX, y: pointY };
            });

            newShape = { type, x, y, zIndex, points, color };
        } catch (error) {
            alert("Invalid polygon points format. Use format x1:y1|x2:y2|x3:y3");
            return;
        }
    }

    // Add the validated shape to the renderer
    renderer.addShape(newShape);
    renderer.render();

    // Close the modal
    shapeModal.style.display = "none";

    // Optional: Clear form for next use
    shapeForm.reset();
});


fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        openShapeFile(file);
    }
});