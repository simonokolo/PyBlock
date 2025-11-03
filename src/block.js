export class Block {
  constructor(blockData) {
    this.blockData = blockData;
    this.element = this.createElement()
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
}
