export class Translator {
  constructor(project) {
    this.project = project;
  }

  // print each block
  translate(project) {
    const lines = [];
    for (const block of project.blocks.values()) {
      console.log(`Block ${block.id}: ${block.type} at (${block.x}, ${block.y}) with values:`, block.values);
    }
  }
}