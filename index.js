// DOM Elements
const shapeViewport = document.getElementById("shapeViewport");
const viewportDimensions = document.getElementById("viewportDimensions");
const topOpenBtn = document.getElementById("topOpenBtn");
const leftOpenBtn = document.getElementById("leftOpenBtn");
const fileInput = document.getElementById("fileInput");

class ShapeRenderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.shapes = [];
    }

    clear() {
        // Clear all shapes from viewport
        this.viewport
            .querySelectorAll(".shape")
            .forEach((shape) => shape.remove());
        this.shapes = [];
    }

    addShape(shapeData) {
        this.shapes.push(shapeData);
    }

    render() {
        // Sort shapes by z-index before rendering
        this.shapes.sort((a, b) => a.zIndex - b.zIndex);

        // Render each shape
        this.shapes.forEach((shape) => {
            if (shape.type === "Rectangle") {
                this.renderRectangle(shape);
            } else if (shape.type === "Triangle") {
                this.renderTriangle(shape);
            }
        });
    }

    renderRectangle(shapeData) {
        const { x, y, width, height, color } = shapeData;

        const rectangle = document.createElement("div");
        rectangle.className = "shape";
        rectangle.style.left = `${x}px`;
        rectangle.style.top = `${y}px`;
        rectangle.style.width = `${width}px`;
        rectangle.style.height = `${height}px`;
        rectangle.style.backgroundColor = `#${color}`;

        this.viewport.appendChild(rectangle);
    }

    renderTriangle(shapeData) {
        const { x, y, size, color } = shapeData;

        const triangle = document.createElement("div");
        triangle.className = "shape";
        triangle.style.left = `${x}px`;
        triangle.style.top = `${y}px`;
        triangle.style.width = "0";
        triangle.style.height = "0";
        triangle.style.borderLeft = `${size / 2}px solid transparent`;
        triangle.style.borderRight = `${size / 2}px solid transparent`;
        triangle.style.borderBottom = `${size}px solid #${color}`;

        this.viewport.appendChild(triangle);
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