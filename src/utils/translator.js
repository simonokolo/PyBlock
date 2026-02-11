export class Translator {
  constructor(project) {
    this.project = project;
    this.lines = [];
    this.indentationLevel = 0;
    this.visited = new Set();
  }

  // get indentation
  indentCode() {
    return "  ".repeat(this.indentationLevel);
  }

  // Add line of code with the proper indentation
  pushCode(line) {
    this.lines.push(this.indentCode() + line);
  }

  // begin translation
  translate() {
    this.visited.clear();
    this.lines.length = 0;
    this.indentationLevel = 0;

    let start;
    for (const block of this.project.blocks.values()) {
      if (block.type === "Start") {
        start = block;
        break;
      }
    }

    // start
    this.traverse(start);

    console.log(this.lines); // Output code
  }

  // recursive call to traverse blocks
  traverse(block) {
    if (!block || this.visited.has(block.id)) return;
    console.log(`Visiting block ${block.id} of type ${block.type}`);
    this.visited.add(block.id);

    // handle blocks based on type
    switch (block.type) {
      case "Loop X Times":
        this.handleLoop(block);
        break;

      case "While":
        this.handleWhile(block);
        break;

      case "If":
        this.handleIf(block);
        break;

      case "Start":
        // start block just traverse next
        this.traverseNext(block);
        break;

      default:
        // normal statement block
        this.pushCode(block.definition.code || console.warn(`${block.id} missing code definition`));  // if missing
        this.traverseNext(block);
        break;
    }
  }

  // find next block connected to the execution output and traverse
  traverseNext(block) {
    const execOutput = block.sockets.filter(
      socket => socket.direction === "output" && socket.type === "flow"
    );

    // if no flow outputs return
    if (execOutput.length === 0) return;

    // since every other block has one exec output, the first one is taken
    const socket = execOutput[0];
    const conns = this.project.getConnectionsForSocket(block.id, socket.id);
    if (conns.length === 0) return;

    const nextBlock = this.project.blocks.get(conns[0].to.blockId);
    this.traverse(nextBlock);
  }

  // handle loop block
  handleLoop(block) {
    const count = block.values.count || alert("Loop block missing value");
    this.pushCode(`for i in range(${count}):`);

    const body = this.getExecOutput(block, "loopContent");  // get loop body
    const after = this.getExecOutput(block, "loopComplete");  // get block after loop

    this.indentationLevel++;  // increase indentation for code inside loop
    this.traverse(body);
    this.indentationLevel--;  // return to same indentation level as loop block after traversing loop body

    this.traverse(after); // traverse blocks after loop
  }

  // handle while block
  handleWhile(block) {
    this.pushCode(`while condition:`);

    const body = this.getExecOutput(block, "loopContent"); // get while loop body
    const after = this.getExecOutput(block, "loopComplete"); // get block after while loop

    this.indentationLevel++;
    this.traverse(body); // traverse while loop body first
    this.indentationLevel--;

    this.traverse(after);
  }

  // handle if block
  handleIf(block) {
    this.pushCode(`if condition:`);

    const trueBranch = this.getExecOutput(block, "true"); // get true branch
    const falseBranch = this.getExecOutput(block, "false"); // get false branch

    this.indentationLevel++;
    this.traverse(trueBranch);  // traverse true branch first
    this.indentationLevel--;

    // if there is a false branch add else statement and traverse it
    if (falseBranch) {
      this.pushCode(`else:`);
      this.indentationLevel++;
      this.traverse(falseBranch);
      this.indentationLevel--;
    }
  }

  // find the block connected to the exec output of the selected socket
  getExecOutput(block, socketName) {
    const socket = block.sockets.find(
      socket => socket.direction === "output" && socket.name === socketName
    );
    if (!socket) console.warn(`Block ${block.id} missing socket ${socketName}`);  // warn if socket not found

    // find connections for this socket
    const conns = this.project.getConnectionsForSocket(block.id, socket.id);
    if (conns.length === 0) return null;  // return null if no connections

    return this.project.blocks.get(conns[0].to.blockId);  // return the block connected to this socket
  }
}