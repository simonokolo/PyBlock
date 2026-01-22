import { BlockRegistry } from "/src/workspace/block-registry.js";
import { Block } from "/src/block.js";

export class Project {
  constructor() {
    this.blocks = new Map(); // id -> block instance data
    this.connections = [];
    this.nextId = 1;
  }

  // Create a new block instance
  async createBlock(type, x, y, values = {}) {
    const definition = BlockRegistry.get(type);
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
      sockets: []
    };

    // Build input sockets
    (definition.inputs || []).forEach((inp, idx) => {
      const type = inp.type || "any";
      const name = inp.name || `input_${idx}`;

      block.sockets.push({
        id: `in-${idx}`,        // block-relative socket id
        direction: "input",
        index: idx,
        name,
        type
      });
    });

    // Build output sockets
    (definition.outputs || []).forEach((outp, idx) => {
      const type = outp.type || "any";
      const name = outp.name || `output_${idx}`;

      block.sockets.push({
        id: `out-${idx}`,       // block-relative socket id
        direction: "output",
        index: idx,
        name,
        type
      });
    });

    this.blocks.set(id, block);
    return block;
  }

  // Remove a block by id
  removeBlock(id) {
    this.blocks.delete(id);

    // Remove associated connections
    this.connections = this.connections.filter(
      c => c.from.blockId !== id && c.to.blockId !== id
    );
  }

  // Add a connection between two sockets
  addConnection(fromBlockId, fromSocketId, toBlockId, toSocketId) {
    // Validate connection
    const isValid = this.connectionValidation(
      fromBlockId,
      fromSocketId,
      toBlockId,
      toSocketId
    );

    if (!isValid) {
      return null; // silently ignore invalid connections
    }

    // Create connection record
    const connection = {
      from: { blockId: fromBlockId, socketId: fromSocketId },
      to: { blockId: toBlockId, socketId: toSocketId }
    };

    this.connections.push(connection);
    return connection;
  }

  connectionValidation(fromBlockId, fromSocketId, toBlockId, toSocketId) {
    // Get socket definitions
    const fromSocket = this.getSocket(fromBlockId, fromSocketId);
    const toSocket = this.getSocket(toBlockId, toSocketId);

    if (!fromSocket || !toSocket) {
      return false;
    }

    // Enforce max connections
    const fromCount = this.getConnectionCount(fromBlockId, fromSocketId);
    const toCount = this.getConnectionCount(toBlockId, toSocketId);
    const fromMax = this.getMaxConnections(fromSocket);
    const toMax = this.getMaxConnections(toSocket);

    // Check max connections
    if (fromCount >= fromMax) {
      console.log("Max connections reached on target socket, removing old connection");
      this.getConnectionsForSocket(fromBlockId, fromSocketId).forEach(conn => {
        this.removeConnection(conn.from.blockId, conn.from.socketId, conn.to.blockId, conn.to.socketId);
      });
      return true;
    }

    // Check max connections
    if (toCount >= toMax) {
      return false;
    }

    // Direction validation
    if (fromSocket.direction !== "output" || toSocket.direction !== "input") {
      return false;
    }

    // Type compatibility check
    if (!this.socketCompatibilityCheck(fromSocket, toSocket)) {
      return false;
    }

    // Prevent self connection
    if (fromBlockId === toBlockId) {
      return false;
    }

    // Prevent duplicate connections
    const duplicate = this.connections.some(
      c =>
        c.from.blockId === fromBlockId &&
        c.from.socketId === fromSocketId &&
        c.to.blockId === toBlockId &&
        c.to.socketId === toSocketId
    );

    if (duplicate) {
      return false; // silently ignore duplicates
    }
    return true;
  }

  // Check socket compatibility
  socketCompatibilityCheck(fromSocket, toSocket) {
    // Flow is execution only
    if (fromSocket.type === "flow" || toSocket.type === "flow") {
      return fromSocket.type === "flow" && toSocket.type === "flow";
    }

    // Normal data compatibility
    return (
      fromSocket.type === "any" ||
      toSocket.type === "any" ||
      fromSocket.type === toSocket.type
    );
  }

  // Get maximum connections allowed for a socket
  getMaxConnections(socket) {
    // Input sockets can have only one connection
    if (socket.direction === "input") {
      return 1;
    }
    
    // Flows can only have one connection
    if (socket.type === "flow") {
      return 1;
    }

    // Other sockets have no limit
    return Infinity;
  }

  // Get current connection count for a socket
  getConnectionCount(blockId, socketId) {
    return this.connections.filter(c =>
      (c.from.blockId === blockId && c.from.socketId === socketId) ||
      (c.to.blockId === blockId && c.to.socketId === socketId)
    ).length;
  }

  removeConnection(fromBlockId, fromSocketId, toBlockId, toSocketId) {
    this.connections = this.connections.filter(
      c =>
        !(
          c.from.blockId === fromBlockId &&
          c.from.socketId === fromSocketId &&
          c.to.blockId === toBlockId &&
          c.to.socketId === toSocketId
        )
    );
  }

  // Get all connections
  getConnections() {
    return this.connections;
  }

  // Get all connections for a specific block
  getConnectionsForBlock(blockId) {
    return this.connections.filter(
      c =>
        c.from.blockId === blockId ||
        c.to.blockId === blockId
    );
  }

  // Get all connections for a specific socket
  getConnectionsForSocket(blockId, socketId) {
    return this.connections.filter(
      c =>
        (c.from.blockId === blockId && c.from.socketId === socketId) ||
        (c.to.blockId === blockId && c.to.socketId === socketId)
    );
  }

  // Get a socket by block id and socket id
  getSocket(blockId, socketId) {
    const block = this.blocks.get(blockId);
    if (!block) return null;

    // Find socket within the block
    return block.sockets.find(s => s.id === socketId) || null;
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
        values: b.values
      })),
      connections: this.connections
    };
  }

  // Deserialize project from save
  async deserialize(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    this.clear();

    for (const b of data.blocks) {
      const block = await this.createBlock(b.type, b.x, b.y, b.values);

      if (b.id != null) {
        this.blocks.delete(block.id);
        block.id = b.id;
        this.blocks.set(block.id, block);
        this.nextId = Math.max(this.nextId, block.id + 1);
      }
    }
    this.connections = data.connections || [];
  }
}
