import { BlockRegistry } from "/src/workspace/block-registry.js";

export class Catalogue {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
    this.blocks;
    this.setupCatalogue();
    this.setupEventListeners();

  }

  // Sets up the catalogue UI
  setupCatalogue() {
    this.container.outerHTML = `
      <div id="catalogue" class="catalogue-container">
        <input type="text" id="blockSearch">
        <div class="catalogue-content"></div>
        <button class="title" id="catalogue-toggle">Catalogue</button>
      </div>`

    this.catalogueContent = document.querySelector('.catalogue-content')
    this.fetchBlocks();
  }

  // Sets up event listeners
  setupEventListeners() {
    const toggleButton = document.getElementById('catalogue-toggle');
    const catalogueContainer = document.getElementById('catalogue');
    const searchBox = document.getElementById('blockSearch');
    
    // Toggle catalogue visibility on button click
    toggleButton.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        catalogueContainer.classList.add('open');
      } else {
        catalogueContainer.classList.remove('open');
      }
    });

    // Search event listener
    searchBox.addEventListener('input', () => {
      const searchInput = document.getElementById('blockSearch').value;
      this.updateCatalogue(searchInput);
    })
  }

  // Fetches block data from a JSON file to initialise the catalogue box
  async fetchBlocks() {
    this.blocks = BlockRegistry.getAll();
    this.updateCatalogue();
  }


  // Update the catalogue with each block
  async updateCatalogue(searchQuery = "") {
    this.catalogueContent.innerHTML = "";

    // Normalize query
    const query = searchQuery.trim().toLowerCase();

    this.blocks.forEach(block => {
      // Only show blocks that match OR show all if query is empty
      if (!query || block.name.toLowerCase().includes(query)) {
        let div = document.createElement("div");

        // Set attributes and inner HTML for the block
        div.id = `${block.name}-node`;
        div.className = "nodePlaceholder";
        div.innerHTML = `
          <img src="${block.blockImage}" alt="${block.name}" draggable="true">
        `;

        // Drag start event to set the data being dragged
        div.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/plain", block.name);
        });


        // Append the block div to the catalogue content
        this.catalogueContent.appendChild(div);
      }
    });
  }
}
