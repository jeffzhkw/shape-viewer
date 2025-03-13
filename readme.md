# Shape Viewer

- Load and parse custom `.shapefile` format files.
- Support for 3 shape types: Rectangle, Triangle, Polygon.
- Display shapes using Three.js to handle large shape count. 
- Drag and drop shape manipulation.
- Create new shapes. 
- Save/export shapes to `.shapefile` format

## 1. Overview 

- I completed iteration 2.1 to 2.5. 
- I implemented 2 extra features: 3.1 and 3.2. 
- I don't encounter major problem with the solution. 

## 2. Implementation

The application has a clean and straightforward architecture.

- Vanlina HTML, CSS, JS
  - OOP: Use of classes (ShapeRenderer) to encapsulate related functionality and in memory representation of the shapes. 
  - Utilizes event listeners for user interactions
- Integrating Three.js to use WebGL render. 
  - Using orthographic camera for 2D view.
  - Efficiently manages mesh objects for optimal performance
  - Scalable to frontend frameworks through thrid party libraries(react-three-fiber)

- Custom filetype `.shapefile` and its parser. 
  - Handles comment lines (prefixed with `//`)
  - Parses shape definitions with proper type-checking
  - Supports multiple shape definitions per line (semicolon-separated)
  - Accommodates different parameter sets for each shape type
- Robust error handling 
  - File parsing
  - Create shape form inputs are validated before processing
  - Use `alert()` to display error messages.

## 3. Additional Feature

`.shapefile` file format supports comments for documentation

## 4. Reference Links

Three.js API for render shapes: https://threejs.org/docs/#api/en/extras/core/Shape

Debug Form submission: https://stackoverflow.com/questions/22148080/an-invalid-form-control-with-name-is-not-focusable
