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
  }

  setupViewport() {
    this.container.innerHTML = `
        <div id="viewport">
            <div id="canvas">
                <div class="node" style="left:100px;top:100px;">Node A</div>
                <div class="node" style="left:300px;top:200px;">Node B</div>
            </div>
        </div>
    `;

    console.log('Viewport created!');

    this.viewport = this.container.querySelector("#viewport");
    this.canvas = this.container.querySelector("#canvas");
  }

  setupEventListeners() {
    this.viewport.addEventListener("mousedown", e => {
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
      if (!this.isPanning) return;
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      // update the canvas position
      this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`;
      console.log(this.canvas.style.transform)
    });

    // stop panning on mouse up
    this.viewport.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.viewport.style.cursor = "default";
    });
  }
}
