export class LiveCode {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupViewport();
    this.setupEventListeners();
  }

  setupViewport() {
    this.container.outerHTML = `
        <div id="livecode">
          <div id="livecode-inner">
            This is the LiveCode inner section
          </div>
        </div>
    `;
  }
  setupEventListeners() {}
}