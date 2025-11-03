import { Block } from "/src/block.js";

export class Canvas {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupViewport();
    this.setupEventListeners();

    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.translateX = 0;
    this.translateY = 0;

    this.draggedNode = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.gridSize = 40;

    this.zoom = 1;
    this.zoomStep = 0.1;
    this.zoomMin = 0.3;
    this.zoomMax = 2;
  }

  setupViewport() {
    this.container.outerHTML = `
        <div id="viewport">
          <h5 id="scale-text">Scale: 100%</h5>
          <div id="canvas">
          </div>
        </div>
    `;

    console.log('Viewport created!');

    this.viewport = document.querySelector("#viewport");
    this.canvas = document.querySelector("#canvas");
  }

  setupEventListeners() {

    //---------[EVENT LISTENERS FOR CANVAS MOVEMENT]---------//

    this.viewport.addEventListener("mousedown", e => {
      if (e.button !== 1) return; // Make sure the canvas only moves with the middle mouse button [Doesnt work for trackpads]
      // only pan when clicking empty space
      if (e.target === this.canvas) { 
        this.isPanning = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;
        this.viewport.style.cursor = "grabbing";
      }
    });

    // stop panning on mouse up
    this.viewport.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.viewport.style.cursor = "default";
      this.draggedNode = null;
    });

    //---------[EVENT LISTENERS FOR CANVAS MOVEMENT]---------//

    // Canvas zooming AND panning with trackpad
    this.viewport.addEventListener("wheel", e => {
      e.preventDefault();
      
      // Check if this is a pinch-to-zoom gesture
      // Pinch zoom always comes with ctrlKey on trackpads
      if (e.ctrlKey) {
        // This is zoom (either trackpad pinch or Ctrl+wheel)
        const oldZoom = this.zoom;
        
        // Use smaller zoom step for smoother pinch zooming
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.02 : 0.98;
        
        this.zoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.zoom * zoomFactor));
        
        // Calculate the point on the canvas that's under the mouse cursor
        const canvasPointX = (e.clientX - this.translateX) / oldZoom;
        const canvasPointY = (e.clientY - this.translateY) / oldZoom;
        
        // After zooming, calculate where that same canvas point should be to keep it under the mouse cursor
        this.translateX = e.clientX - (canvasPointX * this.zoom);
        this.translateY = e.clientY - (canvasPointY * this.zoom);
        
        // Apply clamping
        if (this.translateX > 0) {this.translateX = 0;}
        if (this.translateY > 0) {this.translateY = 0;}

        if (this.translateX < this.viewport.clientWidth - this.canvas.clientWidth * this.zoom) {
          this.translateX = this.viewport.clientWidth - this.canvas.clientWidth * this.zoom;
        }
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
        this.updateZoomText();
        this.updateGrid();
      }
      // Two-finger swipe/pan or vertical scroll on trackpad
      else if (e.deltaMode === 0) {
        // deltaMode 0 = trackpad
        // panning
        this.translateX -= e.deltaX;
        this.translateY -= e.deltaY;
        
        // Make sure canvas is always in the negative to zero range
        const minX = this.viewport.clientWidth - (8000 * this.zoom);
        const minY = this.viewport.clientHeight - (5000 * this.zoom);

        // Clamp the canvas
        this.translateX = Math.max(minX, Math.min(0, this.translateX));
        this.translateY = Math.max(minY, Math.min(0, this.translateY));
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
      }

      // Mouse wheel scroll (deltaMode 1 or 2)
      else {
        // zooming
        const oldZoom = this.zoom;
        
        if (e.deltaY < 0) {
          this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax);
        } else {
          this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin);
        }
        
        // Calculate the point on the canvas under the mouse cursor
        const canvasPointX = (e.clientX - this.translateX) / oldZoom;
        const canvasPointY = (e.clientY - this.translateY) / oldZoom;
        
        // After zooming, calculate where that same canvas point should be to keep it under the mouse cursor
        this.translateX = e.clientX - (canvasPointX * this.zoom);
        this.translateY = e.clientY - (canvasPointY * this.zoom);
        
        // Apply clamping
        if (this.translateX > 0) {this.translateX = 0;}
        if (this.translateY > 0) {this.translateY = 0;}

        if (this.translateX < this.viewport.clientWidth - this.canvas.clientWidth * this.zoom) {
          this.translateX = this.viewport.clientWidth - this.canvas.clientWidth * this.zoom;
        }
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
        this.updateZoomText();
        this.updateGrid();
      }
    }, { passive: false });

    //---------[EVENT LISTENERS NODE MOVEMENT]---------//

    this.viewport.addEventListener("mousemove", e => {
      // only pan when mouse is down
      if (this.isPanning) {
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;

        // Make sure canvas is always in the negative to zero range
        const minX = this.viewport.clientWidth - (8000 * this.zoom);
        const minY = this.viewport.clientHeight - (5000 * this.zoom);

        // Clamp the canvas
        this.translateX = Math.max(minX, Math.min(0, this.translateX));
        this.translateY = Math.max(minY, Math.min(0, this.translateY));
                
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
      }

      // move node if dragging
      if (this.draggedNode) {
        // pointer pos (viewport) minus canvas translation (viewport) minus unscaled offset
        const x = e.clientX - this.translateX - this.offsetX;
        const y = e.clientY - this.translateY - this.offsetY;

        // convert back into canvas (unscaled) coords
        this.draggedNode.style.left = `${x / this.zoom}px`;
        this.draggedNode.style.top  = `${y / this.zoom}px`;
      }
    });

    // Drag and drop from catalogue
    this.canvas.addEventListener('dragover', (e) => {e.preventDefault();});
    this.canvas.addEventListener('drop', (e) => {
      const blockResult = e.dataTransfer.getData('application/json');
      const block = JSON.parse(blockResult);
      const x = (e.clientX - this.translateX) / this.zoom;
      const y = (e.clientY - this.translateY) / this.zoom;
      this.insertNodeFromCatalogue(block, x, y);
    });    
  }

  updateGrid() {
    // Fade OUT small grid when zoomed out
    const alpha = Math.min(1, Math.max(0, (this.zoom - 0.5) / 0.5));

    // Update the background image
    this.canvas.style.backgroundImage = `
      linear-gradient(to right, rgb(64, 64, 64, 1) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(64, 64, 64, 1) 1px, transparent 1px),
      linear-gradient(to right, rgb(52, 52, 52,${0.5 * alpha}) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(52, 52, 52,${0.5 * alpha}) 1px, transparent 1px)
    `;
  }

  // Update the zoom text display
  updateZoomText() {
    const scaleText = document.getElementById("scale-text");
    // Update the text content with the current zoom percentage
    scaleText.textContent = `Scale: ${Math.round(this.zoom * 100)}%`;
  }

  insertNodeFromCatalogue(blockData, x, y) {
    // Create a new block instance
    const block = new Block(blockData);

    // Get the HTML element of the block
    const el = block.element;
    el.classList.add("node");
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // Add mousedown listener for dragging the node
    el.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    // don't start a drag when interacting with form controls inside the node
    if (e.target.matches('input, textarea, select, button')) return;

    this.draggedNode = el;

    // compute offset from the node's rect (in *viewport* coords)
    const rect = el.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;

    this.viewport.style.cursor = "grabbing";
    e.stopPropagation();
  });

    // Append the block element to the canvas
    this.canvas.appendChild(el);
  }
}
