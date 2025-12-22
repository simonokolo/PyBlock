import { BlockRegistry } from "/src/workspace/block-registry.js";
import { Block } from '/src/block.js';

export class Project {
  constructor() {
    this.blocks = new Map(); // id -> block instance data
    this.nextId = 1;
  }

  // Create a new block instance
  async createBlock(type, x, y, values = {}) {
    const definition = await BlockRegistry.get(type);
    if (!definition) {
      throw new Error(`Unknown block type: ${type}`);
    }

    const id = this.nextId++;

    const block = {
      id,
      type,
      definition,
      x,
      y,
      values: { ...values },
    };

    this.blocks.set(id, block);
    return block;
  }

  // Remove a block by id
  removeBlock(id) {
    this.blocks.delete(id);
  }

  // Get all blocks
  getBlocks() {
    return Array.from(this.blocks.values());
  }

  // Remove all blocks
  clear() {
    this.blocks.clear();
    this.nextId = 1;
  }

  // Serialize project for saving
  serialize() {
    return {
      blocks: this.getBlocks().map(b => ({
        id: b.id,
        type: b.type,
        x: b.x,
        y: b.y,
        values: b.values,
      })),
    };
  }

  // Deserialize project from save to load
  async deserialize(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    this.clear();

    for (const b of data.blocks) {
      const block = await this.createBlock(b.type, b.x, b.y, b.values);
      block.id = b.id;
      this.blocks.set(b.id, block);
      this.nextId = Math.max(this.nextId, b.id + 1);
    }
  }
}
