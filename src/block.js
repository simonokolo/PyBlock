// block.js
export class Block {
  static blockList = [];

  constructor(blockData) {
    this.blockData = blockData;
    this.element = this.createElement();
    this.selected = false;
    this.hovered = false;

    Block.blockList.push(this);
    this.setupEventListeners();
  }

  setSelected(state) {
    this.selected = state;
    this.element.classList.toggle("selected", state);
  }

  createElement() {
    const div = document.createElement("div");
    div.className = "node";
    div.dataset.type = this.blockData.type;

    div.innerHTML = `
      <div class="block-label">
        <span>${this.blockData.name}</span>
      </div>
      <div class="block-padding"></div>
      <div class="block-io">
        <div class="inputs"></div>
        <div class="content"></div>
        <div class="outputs"></div>  
      </div>
    `;

    const inputContainer = div.querySelector(".inputs");
    (this.blockData.inputs || []).forEach(input => {
      const socket = document.createElement("div");
      socket.className = `socket input type-${input.type || "any"}`;
      inputContainer.appendChild(socket);
    });

    const outputContainer = div.querySelector(".outputs");
    (this.blockData.outputs || []).forEach(output => {
      const socket = document.createElement("div");
      socket.className = `socket output type-${output.type || "any"}`;
      outputContainer.appendChild(socket);
    });

    const contentContainer = div.querySelector(".content");

    (this.blockData.contents || []).forEach(content => {
      const el = document.createElement(
          content.type === "dropdown" ? "select" : "input"
      );

      el.className = "content-item";

      if (content.type === "dropdown") {
          const placeholder = document.createElement("option");
          placeholder.textContent = content.default;
          placeholder.selected = true;
          el.appendChild(placeholder);
      } else {
          el.value = content.name; // inputs work normally
      }

      contentContainer.appendChild(el);
    });

    
    return div;
  }

  setupEventListeners() {
    this.element.tabIndex = 0;

    this.element.addEventListener("mouseenter", () => {
      this.hovered = true;
    });

    this.element.addEventListener("mouseleave", () => {
      this.hovered = false;
    });

    this.element.addEventListener("click", (e) => {
      if (e.target.matches("input, textarea, select, button")) return;

      Block.blockList.forEach((b) => b.setSelected(false));
      this.setSelected(true);
      e.stopPropagation();
    });
  }
}
