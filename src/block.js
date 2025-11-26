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

    const needsInput = this.blockData.type === "print" || this.blockData.type === "variable";

    div.innerHTML = `
      <div class="block-label">
        <span>${this.blockData.name}</span>
      </div>
      <div class="block-padding"></div>
      <div class="block-io">
        ${needsInput ? '<input type="text" placeholder="value">' : ''}
      </div>
    `;
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
