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
    div.dataset.type = definition.type;

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

    // Inputs
    const inputContainer = div.querySelector(".inputs");
    (definition.inputs || []).forEach(input => {
      const socket = document.createElement("div");

      const type = input.type || "any";

      socket.className = `socket input type-${type}`;
      socket.dataset.direction = "input";
      socket.dataset.type = type;

      inputContainer.appendChild(socket);
    });

    // Outputs
    const outputContainer = div.querySelector(".outputs");
    (definition.outputs || []).forEach(output => {
      const socket = document.createElement("div");

      const type = output.type || "any";

      socket.className = `socket output type-${type}`;
      socket.dataset.direction = "output";
      socket.dataset.type = type;

      outputContainer.appendChild(socket);
    });


    // Contents
    const contentContainer = div.querySelector(".content");
    (definition.contents || []).forEach(content => {
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
