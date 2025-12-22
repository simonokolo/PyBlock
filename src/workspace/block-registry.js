class BlockRegistryClass {
  constructor() {
    this._blocks = new Map(); // name -> block definition
    this._loaded = false; // To prevent multiple classes
  }

  // Load block definitions from JSON file
  async init() {
    if (this._loaded) return;

    // Fetch block definitions
    const res = await fetch("/data/blocks.json");
    if (!res.ok) {
      throw new Error(`Failed to load blocks.json (${res.status})`);
    }

    const data = await res.json();
    const blocks = data.blocks ?? [];

    // Populate the block registry
    blocks.forEach(block => {
      if (!block.name) {
        console.warn("Block missing name:", block);
        return;
      }
      this._blocks.set(block.name, block);
    });

    this._loaded = true;
  }

  // Get block definition by name
  get(name) {
    const block = this._blocks.get(name);
    if (!block) {
      throw new Error(`Block definition not found: ${name}`);
    }
    return block;
  }

  // Get all block definitions for the catalogue
  getAll() {
    return Array.from(this._blocks.values());
  }
}

export const BlockRegistry = new BlockRegistryClass();
