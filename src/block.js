export class Block {
  constructor(projectBlock) {
    this.data = projectBlock; // reference to Project.js
    this.element = this.createElement();
    this.selected = false;
    this.setupEventListeners();
  }

  setSelected(state) {
    this.selected = state;
    this.element.classList.toggle("selected", state);
  }

  createElement() {
    const { definition } = this.data;

    const div = document.createElement("div");
    div.className = "node";
    div.dataset.type = definition.type; // Changed from 'name' to 'type' to fix block colouring

    div.innerHTML = `
      <div class="block-label">
        <span>${definition.name}</span>
      </div>
      <div class="block-padding"></div>
      <div class="block-io">
        <div class="inputs"></div>
        <div class="content"></div>
        <div class="outputs"></div>  
      </div>
    `;

    // Inputs: render from the block instance sockets
    const inputContainer = div.querySelector(".inputs");
    (this.data.sockets || []).filter(s => s.direction === "input").forEach(s => {
      const socket = document.createElement("div");

      // class includes the socket type so css can color it: .socket.type-string etc.
      socket.className = `socket input type-${s.type}`;
      socket.dataset.direction = s.direction;
      socket.dataset.type = s.type;
      socket.dataset.index = s.index;
      socket.dataset.blockId = this.data.id;
      socket.dataset.socketId = s.id;
      socket.title = s.name;

      inputContainer.appendChild(socket);
    });

    // Outputs: render from the block instance sockets
    const outputContainer = div.querySelector(".outputs");
    (this.data.sockets || []).filter(s => s.direction === "output").forEach(s => {
      const socket = document.createElement("div");

      socket.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();

        // notify canvas
        document.dispatchEvent(
          new CustomEvent("start-connection-drag", {
            detail: {
              blockId: this.data.id,
              socketId: s.id
            }
          })
        );
      });

      socket.className = `socket output type-${s.type}`;
      socket.dataset.direction = s.direction;
      socket.dataset.type = s.type;
      socket.dataset.index = s.index;
      socket.dataset.blockId = this.data.id;
      socket.dataset.socketId = s.id;
      socket.title = s.name;

      outputContainer.appendChild(socket);
    });

    // Contents (unchanged)
    const contentContainer = div.querySelector(".content");
    (definition.contents || []).forEach((content) => {
      const el = document.createElement(
        content.type === "dropdown" ? "select" : "input"
      );

      el.className = "content-item";
      el.value = this.data.values?.[content.name] ?? content.default ?? "";
      el.addEventListener("change", () => {
        this.data.values[content.name] = el.value;
      });

      contentContainer.appendChild(el);
    });

    return div;
  }

  setupEventListeners() {
    this.element.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      e.stopPropagation();
    });
  }
}
