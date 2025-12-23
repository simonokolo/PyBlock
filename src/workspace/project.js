import { BlockRegistry } from "/src/workspace/block-registry.js";
import { Block } from '/src/block.js';

export class Project {
  constructor() {
    this.blocks = new Map(); // id -> block instance data
    this.nextId = 1;

    // socketId > { blockId, socket }
    this.socketIndex = new Map();
  }

  // Create a new block instance
  async createBlock(type, x, y, values = {}) {
    const definition = BlockRegistry.get(type); // synchronous after init
    if (!definition) {
      throw new Error(`Unknown block type: ${type}`);
    }

    const id = this.nextId++;

    // Prepare block skeleton
    const block = {
      id,
      type,
      definition,
      x,
      y,
      values: { ...values },
      sockets: [] // will fill below
    };

    // Get max connections based on the socket type
    const getMaxConnections = (socketType, direction) => {

      if (socketType === "flow") {
        return 1;
      } else {
        return direction === "input" ? 1 : Infinity;
      }
    };

    // Build sockets from definition.inputs
    (definition.inputs || []).forEach((inp, idx) => {
      const type = inp.type || "any";
      const name = inp.name || `input_${idx}`;
      const socketId = `block${id}-in-${idx}`;

      const socket = {
        id: socketId,
        direction: "input",
        index: idx,
        name,
        type,
        maxConnections: getMaxConnections(type, "input"),
        connections: [] // list of connected ids
      };

      block.sockets.push(socket);
      this.socketIndex.set(socketId, { blockId: id, socket });
    });

    // Build sockets from definition.outputs
    (definition.outputs || []).forEach((outp, idx) => {
      const type = outp.type || "any";
      const name = outp.name || `output_${idx}`;
      const socketId = `block${id}-out-${idx}`;

      const socket = {
        id: socketId,
        direction: "output",
        index: idx,
        name,
        type,
        maxConnections: getMaxConnections(type, "output"),
        connections: []
      };

      block.sockets.push(socket);
      this.socketIndex.set(socketId, { blockId: id, socket });
    });

    this.blocks.set(id, block);
    return block;
  }

  // Remove a block by id (and clean up any socketIndex entries)
  removeBlock(id) {
    const block = this.blocks.get(id);
    if (!block) return;

    // remove socket registrations
    (block.sockets || []).forEach(s => {
      this.socketIndex.delete(s.id);
    });

    this.blocks.delete(id);
  }

  // Convenience: lookup socket by socketId
  getSocket(socketId) {
    return this.socketIndex.get(socketId) || null;
  }

  // Get all blocks
  getBlocks() {
    return Array.from(this.blocks.values());
  }

  // Remove all blocks
  clear() {
    this.blocks.clear();
    this.socketIndex.clear();
    this.nextId = 1;
  }

  // Serialize project for saving (note: sockets are regenerated from definition on load)
  serialize() {
    return {
      blocks: this.getBlocks().map(b => ({
        id: b.id,
        type: b.type,
        x: b.x,
        y: b.y,
        values: b.values,
        // Note: connections will go here once implemented
      })),
      // connections: [] // placeholder when we add them
    };
  }

  // Deserialize project from save to load
  async deserialize(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    this.clear();

    for (const b of data.blocks) {
      const block = await this.createBlock(b.type, b.x, b.y, b.values);
      // preserve the incoming id (if save had stable ids)
      if (b.id != null) {
        // remove generated block from map, reassign id, and re-register sockets with correct ids
        this.blocks.delete(block.id);

        const oldId = block.id;
        block.id = b.id;
        this.blocks.set(block.id, block);

        // We must also update each socket id (they were derived from the temp id)
        // We'll rebuild socketIndex entries with the saved block id.
        block.sockets.forEach(s => {
          // old socket id format based on oldId: replace prefix
          const newSid = s.id.replace(`block${oldId}-`, `block${block.id}-`);
          // remove old index entry and reassign
          this.socketIndex.delete(s.id);
          s.id = newSid;
          this.socketIndex.set(s.id, { blockId: block.id, socket: s });
        });

        // ensure nextId keeps growing
        this.nextId = Math.max(this.nextId, block.id + 1);
      }
    }

    // TODO: load connections when that format is added to saved JSON
  }
}
