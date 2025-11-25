export class Block {
  constructor(blockData) {
    this.blockData = blockData;
    this.element = this.createElement()
    this.setupEventListeners()
    this.hovered = false;
  }

  // Creates the HTML element for the block
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
    // Make the element focusable
    this.element.tabIndex = 0;

    this.element.addEventListener('mouseenter', () => {
      this.hovered = true;      
    });

    this.element.addEventListener('mouseleave', () => {
      this.hovered = false;
    });

    // Delete node
    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace') {
        this.element.remove();
      }
    });
  };
}

