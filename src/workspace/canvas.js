import { Block } from "/src/block.js";

export class Canvas {
  constructor(containerId, project) {
    this.project = project;
    this.container = document.getElementById(containerId);
    this.setupViewport();
    
    // map of projectBlockId 
    this.blockViews = new Map();

    // SVG layer for connections
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.classList.add("connection-layer");
    this.svg.style.zIndex = "1";
    this.svg.style.position = "absolute";
    this.svg.style.top = "0";
    this.svg.style.left = "0";
    this.svg.style.width = "100%";
    this.svg.style.height = "100%";
    this.svg.style.pointerEvents = "none";

    // colours for data types
    this.typeColours = {
      "string": "#E91E63",
      "integer": "#1E3A8A",
      "float": "#00ACC1",
      "boolean": "#AEEA00",
    };

    this.setupEventListeners();

    // movement / panning statez
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.translateX = 0;
    this.translateY = 0;

    // dragging nodes
    this.isDraggingNodes = false;
    this.draggedNode = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.gridSize = 20;

    // zoom state
    this.zoom = 1;
    this.zoomStep = 0.1;
    this.zoomMin = 0.3;
    this.zoomMax = 2;

    // selection box state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // mouse drag state for nodes
    this.dragStartMouseX = 0;
    this.dragStartMouseY = 0;
    this.dragOriginalPositions = []; // [{ view, x, y }]

    // drag connections
    this.draggingConnection = null;
    this.tooltip.style.visibility = "hidden";
    
    // render any existing blocks in the project
    this.renderFromProject();
    // centre the viewport so the canvas starts in the middle
    this.centerViewport();
  }

  setupViewport() {
    this.container.outerHTML = `
        <div id="viewport">
          <h5 id="scale-text">Scale: 100%</h5>
          <div id="tooltip" class="material-icons">Tooltip</div>
          <div id="canvas">
          </div>
        </div>
    `;

    this.viewport = document.querySelector("#viewport");
    this.canvas = document.querySelector("#canvas");
    this.tooltip = document.getElementById("tooltip")
  }

  setupEventListeners() {
    let selectionBox = null;
    //---------[EVENT LISTENERS FOR CONNECTION DRAGGING]---------//

    // Finish dragging connection on mouse up
    window.addEventListener("mouseup", (e) => {
      if (!this.draggingConnection) return;

      try {
        const el = document.elementFromPoint(e.clientX, e.clientY);

        if (
          el &&
          el.classList.contains("socket") &&
          el.dataset.direction === "input"
        ) {
          const toBlockId = Number(el.dataset.blockId);
          const toSocketId = el.dataset.socketId;

          this.project.addConnection(
            this.draggingConnection.fromBlockId,
            this.draggingConnection.fromSocketId,
            toBlockId,
            toSocketId
          );
        }
      } catch (err) {
        // Expected for invalid connections — log if you want
        console.warn("Connection rejected [", err.message, "]");
      } finally {
        // Hide tooltip
        this.tooltip.style.visibility = "hidden";
        this.tooltip.textContent = "";

        // remove temp path if invalid connection
        this.draggingConnection.pathEl.remove();
        this.draggingConnection = null;
        this.renderConnections();
      }
    });

    // Listen for start of connection drag from any bloc
    document.addEventListener("start-connection-drag", (e) => {
      const { blockId, socketId } = e.detail;

      const fromPos = this.getSocketPosition(blockId, socketId);
      if (!fromPos) return;

      const path = this.createTempPath();

      // store dragging state
      this.draggingConnection = {
        fromBlockId: blockId,
        fromSocketId: socketId,
        pathEl: path,
        fromPos
      };
    });

    // Create variable event from VarCreate blocks
    document.addEventListener('project-create-variable', (e) => {
      const { name, type } = e.detail || {};
      if (!name) return;
      this.project.addVariable(name, type || console.warn("Variable type missing"));

      // Refresh variable dropdowns on existing blocks
      const variables = this.project.getAllVariables();
      Array.from(this.blockViews.values()).forEach(v => {
        try { v.updateVariableOptions(variables); } catch (err) {}
      });
    });

    //---------[EVENT LISTENERS FOR CANVAS MOVEMENT]---------//

    // Stop panning and remove selection box on mouse up
    this.viewport.addEventListener("mouseup", () => {

      if (this.isDraggingNodes) {
        // Snap selected nodes to grid and update project positions
        Array.from(this.blockViews.values())
          .filter(v => v.selected)
          .forEach(v => {
            const x = parseFloat(v.element.style.left) || 0;
            const y = parseFloat(v.element.style.top) || 0;

            const snappedX = this.snapToGrid(x);
            const snappedY = this.snapToGrid(y);

            v.element.style.left = `${snappedX}px`;
            v.element.style.top  = `${snappedY}px`;

            // update project data
            v.data.x = snappedX;
            v.data.y = snappedY;
          });
      }

      this.isDragging = false;
      this.isDraggingNodes = false;

      // Remove selection box
      if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
      }

      // stop panning
      this.isPanning = false;
      this.viewport.style.cursor = "default";
      this.draggedNode = null;
    });

    // Canvas zooming AND panning with trackpad
    this.viewport.addEventListener("wheel", e => {
      e.preventDefault();
      
      // Pinch-to-zoom (ctrlKey)
      if (e.ctrlKey) {
        const oldZoom = this.zoom;
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.02 : 0.98;
        this.zoom = Math.max(this.zoomMin, Math.min(this.zoomMax, this.zoom * zoomFactor));
        
        // Adjust translation to keep canvas point under cursor stable
        const canvasPointX = (e.clientX - this.translateX) / oldZoom;
        const canvasPointY = (e.clientY - this.translateY) / oldZoom;
        this.translateX = e.clientX - (canvasPointX * this.zoom);
        this.translateY = e.clientY - (canvasPointY * this.zoom);

        if (this.translateX > 0) {this.translateX = 0;}
        if (this.translateY > 0) {this.translateY = 0;}

        // Clamp to right/bottom edges
        if (this.translateX < this.viewport.clientWidth - this.canvas.clientWidth * this.zoom) {
          this.translateX = this.viewport.clientWidth - this.canvas.clientWidth * this.zoom;
        }
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
        this.updateZoomText();
        this.updateGrid();
      }
      // Two-finger swipe/pan
      else if (e.deltaMode === 0) {
        this.translateX -= e.deltaX;
        this.translateY -= e.deltaY;
        
        const minX = this.viewport.clientWidth - (8000 * this.zoom);
        const minY = this.viewport.clientHeight - (5000 * this.zoom);

        this.translateX = Math.max(minX, Math.min(0, this.translateX));
        this.translateY = Math.max(minY, Math.min(0, this.translateY));
        
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
      }

      // Mouse wheel zoom
      else {
        const oldZoom = this.zoom;
        
        if (e.deltaY < 0) {
          this.zoom = Math.min(this.zoom + this.zoomStep, this.zoomMax);
        } else {
          this.zoom = Math.max(this.zoom - this.zoomStep, this.zoomMin);
        }
        
        const canvasPointX = (e.clientX - this.translateX) / oldZoom;
        const canvasPointY = (e.clientY - this.translateY) / oldZoom;
        this.translateX = e.clientX - (canvasPointX * this.zoom);
        this.translateY = e.clientY - (canvasPointY * this.zoom);
        
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

    //---------[EVENT LISTENERS DRAG]---------//

    // Start selection box on left mouse down (on empty canvas)
    this.viewport.addEventListener("mousedown", (e) => {
      if (e.button === 0 && e.target === this.canvas) {
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.isDragging = true;

        selectionBox = document.createElement("div");
        selectionBox.classList.add("selection-box");
        document.body.appendChild(selectionBox);
        selectionBox.style.left = `${this.dragStartX}px`;
        selectionBox.style.top = `${this.dragStartY}px`;
    
        // clear selection
        Array.from(this.blockViews.values()).forEach(v => v.setSelected(false));
      }
    });

    //---------[EVENT LISTENERS NODE MOVEMENT]---------//

    this.viewport.addEventListener("mousemove", e => {
      
      // Update tooltip position
      this.tooltip.style.left = e.clientX + 15 + "px";
      this.tooltip.style.top = e.clientY + 15 + "px";

      // Update dragging connection temp path
      if (this.draggingConnection) {

        // check for socket under mouse
        const el = document.elementFromPoint(e.clientX, e.clientY);

        // get validity of connection
        if (el && el.classList.contains("socket") && el.dataset.direction === "input") {
          const connectionValid = this.project.connectionValidation(
            this.draggingConnection.fromBlockId,
            this.draggingConnection.fromSocketId,
            Number(el.dataset.blockId),
            el.dataset.socketId
          );

          // show valid/invalid tooltip
          if (connectionValid) {
            this.tooltip.textContent = "check";
            this.tooltip.style.visibility = "visible";
          } else {
            this.tooltip.textContent = "close";
            this.tooltip.style.visibility = "visible";
          }
        } else {
          this.tooltip.textContent = "";
          this.tooltip.style.visibility = "hidden";
        }

        // current mouse position in canvas coords
        const mousePos = {
          x: (e.clientX - this.translateX) / this.zoom,
          y: (e.clientY - this.translateY) / this.zoom
        };


        // update temp path
        const { fromPos, pathEl } = this.draggingConnection;
        const d = this.drawConnection(fromPos, mousePos);
        // update path element
        pathEl.setAttribute("d", d);
      }

      // only pan when mouse is down
      if (this.isPanning) {
        this.renderConnections();
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;

        const minX = this.viewport.clientWidth - (8000 * this.zoom);
        const minY = this.viewport.clientHeight - (5000 * this.zoom);

        this.translateX = Math.max(minX, Math.min(0, this.translateX));
        this.translateY = Math.max(minY, Math.min(0, this.translateY));
                
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
      }

      // Update selection box and highlight intersecting nodes
      if (this.isDragging && selectionBox) {
        const left = Math.min(e.clientX, this.dragStartX);
        const top = Math.min(e.clientY, this.dragStartY);
        const width = Math.abs(e.clientX - this.dragStartX);
        const height = Math.abs(e.clientY - this.dragStartY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        const box = { left, top, right:left+width, bottom:top+height };

        Array.from(this.blockViews.values()).forEach(v => {
          const r = v.element.getBoundingClientRect();
          const hit =
            r.right > box.left &&
            r.left < box.right &&
            r.bottom > box.top &&
            r.top < box.bottom;

          v.setSelected(hit);
        });
      }

      // Move selected nodes while dragging nodes
      if (this.isDraggingNodes) {
        this.renderConnections();
        // calculate mouse delta
        const dx = (e.clientX - this.dragStartMouseX) / this.zoom;
        const dy = (e.clientY - this.dragStartMouseY) / this.zoom;

        this.dragOriginalPositions.forEach(p => {
          const newX = this.snapToGrid(p.x + dx);
          const newY = this.snapToGrid(p.y + dy);

          p.view.element.style.left = `${newX}px`;
          p.view.element.style.top  = `${newY}px`;
        });
      }

    });

    // Delete nodes on Backspace
    window.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        // find selected views
        const selected = Array.from(this.blockViews.values()).filter(v => v.selected);
        selected.forEach(v => {
          v.element.remove();
          this.blockViews.delete(v.data.id);
          // remove from project
          this.project.removeBlock(v.data.id);
        });
        this.renderConnections();
      }
    });

    // Drag and drop from catalogue
    this.canvas.addEventListener('dragover', (e) => {e.preventDefault();});
    this.canvas.addEventListener('drop', (e) => {
      const type = e.dataTransfer.getData("text/plain");
      const x = (e.clientX - this.translateX) / this.zoom;
      const y = (e.clientY - this.translateY) / this.zoom;
      this.insertNodeFromCatalogue(type, x, y);
    });    
  }

  updateGrid() {
    // Keep the same alpha calculation for sub-grid fade
    const alpha = Math.min(1, Math.max(0, (this.zoom - 0.5) / 0.5));

    // Ensure major lines are at least 1px on screen
    const majorLineWidth = Math.max(1 / this.zoom, 1); // in px
    const minorLineWidth = Math.max(0.5 / this.zoom, 0.5); // in px

    this.canvas.style.backgroundImage = `
      linear-gradient(to right, rgba(64, 64, 64, 1) ${majorLineWidth}px, transparent ${majorLineWidth}px),
      linear-gradient(to bottom, rgba(64, 64, 64, 1) ${majorLineWidth}px, transparent ${majorLineWidth}px),
      linear-gradient(to right, rgba(52, 52, 52, ${0.5 * alpha}) ${minorLineWidth}px, transparent ${minorLineWidth}px),
      linear-gradient(to bottom, rgba(52, 52, 52, ${0.5 * alpha}) ${minorLineWidth}px, transparent ${minorLineWidth}px)
    `;
  }


  updateZoomText() {
    const scaleText = document.getElementById("scale-text");
    scaleText.textContent = `Scale: ${Math.round(this.zoom * 100)}%`;
  }

  snapToGrid(value) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  // Render all blocks currently in the project (clear canvas first)
  renderFromProject() {
    // remove all existing DOM nodes for blocks
    // Clear only block views
    this.canvas.innerHTML = "";

    // Re-attach SVG layer
    this.canvas.appendChild(this.svg);

    this.blockViews.clear();

    const blocks = this.project.getBlocks();
    blocks.forEach(b => {
      const view = new Block(b);
      view.element.style.position = "absolute";
      view.element.style.left = `${b.x}px`;
      view.element.style.top = `${b.y}px`;

      // add mousedown handler for dragging/selecting
      view.element.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        if (e.target.matches("input, textarea, select, button")) return;

        // If this view isnt selected, select only this
        if (!view.selected) {
          Array.from(this.blockViews.values()).forEach(v => v.setSelected(false));
          view.setSelected(true);
        }

        // Start multi-drag for all selected blocks
        this.isDraggingNodes = true;
        this.dragStartMouseX = e.clientX;
        this.dragStartMouseY = e.clientY;

        this.dragOriginalPositions = Array.from(this.blockViews.values())
          .filter(v => v.selected)
          .map(v => ({
            view: v,
            x: parseFloat(v.element.style.left) || 0,
            y: parseFloat(v.element.style.top) || 0,
          }));

        this.viewport.style.cursor = "grabbing";
        e.stopPropagation();
      });

      this.canvas.appendChild(view.element);
      this.blockViews.set(b.id, view);

      // populate variable dropdowns for this block from project
      try {
        view.updateVariableOptions(this.project.getAllVariables());
      } catch (e) {}
    });

    // Now redraw connections
    this.renderConnections();
  }

  // Get the canvas position of a socket for connection drawing
  getSocketPosition(blockId, socketId) {
    const socketEl = document.querySelector(
      `.socket[data-block-id="${blockId}"][data-socket-id="${socketId}"]`
    );

    if (!socketEl) return null;

    // get bounding rects
    const rect = socketEl.getBoundingClientRect();

    // Convert screen coords to canvas coords
    const x =
      (rect.left + rect.width / 2 - this.translateX) / this.zoom;
    const y =
      (rect.top + rect.height / 2 - this.translateY) / this.zoom;

    return { x, y };
  }

  drawConnection(fromPos, toPos) {
    const dx = Math.abs(toPos.x - fromPos.x) * 0.5;

    return `
      M ${fromPos.x} ${fromPos.y}
      C ${fromPos.x + dx} ${fromPos.y},
        ${toPos.x - dx} ${toPos.y},
        ${toPos.x} ${toPos.y}
    `;
  }

  renderConnections() {
    this.svg.innerHTML = "";

    for (const conn of this.project.getConnections()) {
      // get socket positions
      const from = this.getSocketPosition(conn.from.blockId, conn.from.socketId);
      const to = this.getSocketPosition(conn.to.blockId, conn.to.socketId);

      // Get colour based on starting socket type
      const startSocketType = this.project.getSocket(conn.from.blockId, conn.from.socketId)?.type;
      const colour = this.typeColours[startSocketType] || "#ffffff";

      if (!from || !to) continue;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

      // Make clickable area bigger
      path.style.pointerEvents = "stroke";
      path.setAttribute("stroke-width", "30");
      path.setAttribute("cursor", "pointer");
      path.setAttribute("stroke", "#00000000");
      path.setAttribute("fill", "none");

      //visible path on top
      const visiblePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      visiblePath.setAttribute("d", this.drawConnection(from, to));
      visiblePath.setAttribute("stroke", colour);
      visiblePath.setAttribute("stroke-width", "3");
      visiblePath.setAttribute("fill", "none");

      // Click to delete connection
      path.addEventListener("click", (e) => {

        this.project.removeConnection(
          conn.from.blockId,
          conn.from.socketId,
          conn.to.blockId,
          conn.to.socketId
        );

        // Hide tooltip
        this.tooltip.style.visibility = "hidden";
        this.tooltip.textContent = "delete";

        // Re-render connections
        this.renderConnections();
        e.stopPropagation();
      });

      // Tooltip on hover
      path.addEventListener("mouseenter", () => {
        this.tooltip.textContent = "delete";
        this.tooltip.style.visibility = "visible";
      })

      // Hide tooltip on leave
      path.addEventListener("mouseleave", () => {
        this.tooltip.style.visibility = "hidden";
        this.tooltip.textContent = "delete";
      })

      // Draw the paths
      path.setAttribute("d", this.drawConnection(from, to)); // for invisible collision area
      this.svg.appendChild(path);
      this.svg.appendChild(visiblePath);
    }
  }

  // Center the canvas viewport within the available viewport area
  centerViewport() {
    if (!this.viewport || !this.canvas) return;

    // viewport and canvas sizes
    const vw = this.viewport.clientWidth;
    const vh = this.viewport.clientHeight;
    const cw = this.canvas.clientWidth * this.zoom;
    const ch = this.canvas.clientHeight * this.zoom;

    // translate to center canvas
    let tx = (vw - cw) / 2;
    let ty = (vh - ch) / 2;

    // clamp to allowed ranges
    const minX = vw - (this.canvas.clientWidth * this.zoom);
    const minY = vh - (this.canvas.clientHeight * this.zoom);
    tx = Math.max(minX, Math.min(0, tx));
    ty = Math.max(minY, Math.min(0, ty));

    // apply translation
    this.translateX = tx;
    this.translateY = ty;

    this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
    this.updateGrid();
    this.updateZoomText();
    this.renderConnections();
  }

  // Create a temporary SVG path for dragging connections
  createTempPath() {
    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    // styling
    path.setAttribute("stroke", "#ffffff47");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");

    // add to SVG layer
    this.svg.appendChild(path);
    return path;
  }

  // Insert a new node into the project and render it
  async insertNodeFromCatalogue(type, x, y) {
    // create project block
    const projectBlock = await this.project.createBlock(type, x, y);
    // create visual view
    const blockView = new Block(projectBlock);

    const el = blockView.element;
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    // mousedown handler - same as in renderFromProject
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.matches("input, textarea, select, button")) return;

      if (!blockView.selected) {
        Array.from(this.blockViews.values()).forEach(v => v.setSelected(false));
        blockView.setSelected(true);
      }

      this.isDraggingNodes = true;
      this.dragStartMouseX = e.clientX;
      this.dragStartMouseY = e.clientY;

      this.dragOriginalPositions = Array.from(this.blockViews.values())
        .filter(v => v.selected)
        .map(v => ({
          view: v,
          x: parseFloat(v.element.style.left) || 0,
          y: parseFloat(v.element.style.top) || 0,
        }));

      this.viewport.style.cursor = "grabbing";
      e.stopPropagation();
    });

    this.canvas.appendChild(el);
    this.blockViews.set(projectBlock.id, blockView);

    // populate variable dropdowns for this newly inserted block
    try {
      blockView.updateVariableOptions(this.project.getAllVariables());
    } catch (e) {}
  }

}