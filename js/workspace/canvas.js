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
    this.zoomMin = 0.4;
    this.zoomMax = 2;
  }

  setupViewport() {
    this.container.innerHTML = `
        <div id="viewport">
            <div id="canvas">
                <div class="node" id="node" style="left:100px;top:100px;">Node A</div>
                <div class="node" id="node" style="left:300px;top:200px;">Node B</div>
            </div>
        </div>
    `;

    console.log('Viewport created!');

    this.viewport = this.container.querySelector("#viewport");
    this.canvas = this.container.querySelector("#canvas");
  }

  setupEventListeners() {

    //---------[EVENT LISTENERS FOR CANVAS MOVEMENT]---------//

    this.viewport.addEventListener("mousedown", e => {
      if (e.button !== 1) return; // Make sure the canvas only moves with the middle mouse button
      // only pan when clicking empty space
      if (e.target === this.canvas) { 
        this.isPanning = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;
        this.viewport.style.cursor = "grabbing";
      }
    });

    this.viewport.addEventListener("mousemove", e => {
      // only pan when mouse is down
      if (this.isPanning) {
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;

        // Make sure canvas is always in the negative to zero range
        if (this.translateX > 0) {this.translateX = 0; }
        if (this.translateY > 0) {this.translateY = 0; }
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
        console.log(this.canvas.style.transform)
      }

      // move node if dragging
      if(this.draggedNode) {
        // move the node
        let x = e.clientX - this.offsetX - this.translateX;
        let y = e.clientY - this.offsetY - this.translateY;
        this.draggedNode.style.left = `${x}px`;
        this.draggedNode.style.top = `${y}px`;
      }
    });

    // stop panning on mouse up
    this.viewport.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.viewport.style.cursor = "default";
      this.draggedNode = null;
    });

    //---------[EVENT LISTENERS FOR CANVAS MOVEMENT]---------//

    // Canvas zooming
    this.viewport.addEventListener("wheel", e => {
      e.preventDefault(); // Prevent page scrolling
      
      const oldZoom = this.zoom;
      
      if (e.deltaY < 0) {
        this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax)
      } else {
        this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin)
      }
      
      // Calculate the point on the canvas that's under the mouse cursor
      const canvasPointX = (e.clientX - this.translateX) / oldZoom;
      const canvasPointY = (e.clientY - this.translateY) / oldZoom;
      
      // After zooming, calculate where that same canvas point should be to keep it under the mouse cursor
      this.translateX = e.clientX - (canvasPointX * this.zoom);
      this.translateY = e.clientY - (canvasPointY * this.zoom);
      
      // Apply clamping
      if (this.translateX > 0) {this.translateX = 0;}
      if (this.translateY > 0) {this.translateY = 0;}
      
      // Apply the new transform
      this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
      console.log(this.canvas.style.transform)
    })


    //---------[EVENT LISTENERS NODE MOVEMENT]---------//

    this.canvas.querySelectorAll(".node").forEach(node => {
      node.addEventListener("mousedown", e => {
        if (e.button !== 0) return; // Make sure the canvas only moves with the right mouse button
        this.draggedNode = node;
        this.offsetX = e.offsetX;
        this.offsetY = e.offsetY;
        this.viewport.style.cursor = "grabbing";
        e.stopPropagation();
      });
    })
    
  }
}
