export class Translator {
  constructor(project) {
    this.project = project;
    this.lines = [];
    this.indentationLevel = 0;
    this.visited = new Set();

    // handlers for flow blocks
    this.handlers = {
      Start: this.handleStart.bind(this),
      Output: this.handleOutput.bind(this),
      VarSet: this.handleVarSet.bind(this),
      VarCreate: this.handleVarCreate.bind(this),
      If: this.handleIf.bind(this),
      While: this.handleWhile.bind(this),
      "Loop X Times": this.handleLoop.bind(this)
    };
  }

  //============================
  // ENTRY
  //============================

  translate() {
    this.lines = [];
    this.indentationLevel = 0;
    this.visited.clear();

    // find the Start block to begin traversal
    const start = [...this.project.blocks.values()]
      .find(b => b.type === "Start");
    if (!start) {console.warn("No Start block found");
      return "";
    }

    // traverse starting from the start block
    this.traverseFlow(start);
    return this.lines.join("\n");
  }

  //============================
  // FLOW TRAVERSAL
  //============================

  traverseFlow(block) {
    if (!block || this.visited.has(block.id)) return;
    // mark block as visited to prevent infinite loops
    this.visited.add(block.id);

    const handler = this.handlers[block.type];

    // check if there is handler for the type
    if (handler) {
      handler(block);
    } else {
      this.handleGeneric(block);
    }
  }

  handleStart(block) {
    // simply get next block
    this.traverseFlow(this.getNextFlow(block));
  }

  handleGeneric(block) {
    const code = this.compileExpression(block);

    // add code to list if exists
    if (code) {this.pushCode(code);}

    // continue traversal
    this.traverseFlow(this.getNextFlow(block));
  }

  //============================
  // OUTPUT
  //============================

  handleOutput(block) {
    // get value to print
    const value = this.resolveExpressionInput(block, "value");

    this.pushCode(`print(${value})`);
    // continue traversal
    this.traverseFlow(this.getNextFlow(block));
  }

  //============================
  // VARIABLES
  //============================

  handleVarSet(block) {
    // get variable name and value
    const variable = block.values?.variable;
    const value = this.resolveExpressionInput(block, "value");
    // set variable and value and continue traversal
    this.pushCode(`${variable} = ${value}`);
    this.traverseFlow(this.getNextFlow(block));
  }

  handleVarCreate(block) {
    const name = block.values?.name;

    // defaults for each datatype
    const defaults = {
      integer: "0",
      float: "0.0",
      string: '""',
      boolean: "False"
    };

    // get datatype and default value for it
    const datatype = block.values?.datatype;
    const value = defaults[datatype] ?? "None";

    // create variable with default value and continue traversal
    this.pushCode(`${name} = ${value}`);
    this.traverseFlow(this.getNextFlow(block));
  }

  //============================
  // CONTROL FLOW
  //============================

  handleIf(block) {
    // get condition for if statement
    const condition = this.resolveExpressionInput(block, "condition");
    this.pushCode(`if ${condition}:`);

    // get branches for true and false
    const trueBranch = this.getExecOutput(block, "true");
    const falseBranch = this.getExecOutput(block, "false");

    // handle true branch
    this.indent(() => this.traverseFlow(trueBranch));

    // handle false branch if exists
    if (falseBranch) {
      this.pushCode("else:");
      this.indent(() => this.traverseFlow(falseBranch));
    }
  }

  handleWhile(block) {
    // get condition for while loop
    const condition = this.resolveExpressionInput(block, "condition");
    this.pushCode(`while ${condition}:`);

    // get loop body and after loop flow
    const body = this.getExecOutput(block, "loopContent");
    const after = this.getExecOutput(block, "loopComplete");

    // handle and indent loop body
    this.indent(() => this.traverseFlow(body));
    this.traverseFlow(after);
  }

  handleLoop(block) {
    // get count for loop
    const count =
      this.resolveExpressionInput(block, "count") ||
      block.values?.count ||
      "0";
    this.pushCode(`for i in range(${count}):`);

    // get loop body and after loop flow
    const body = this.getExecOutput(block, "loopContent");
    const after = this.getExecOutput(block, "loopComplete");

    // handle and indent loop body
    this.indent(() => this.traverseFlow(body));
    this.traverseFlow(after);
  }

  //============================
  // EXPRESSION COMPILER
  //============================

  compileExpression(block) {
    // if block has no code template make it direct
    const template = block.definition?.code;
    if (!template) {return block.values?.inputValue ?? ""}

    let code = template;
    const inputs = block.definition.inputs || [];

    // replace input placeholders with actual values
    for (const input of inputs) {
      if (input.type === "flow") continue;

      // resolve value for this input
      const value = this.resolveExpressionInput(block, input.name);

      // replace placeholder with the value
      if (value !== undefined && value !== null) {
        code = code.replaceAll(input.name, value);
      }
    }

    return code;
  }

  resolveExpressionInput(block, socketName) {
    // find the input socket with the given name
    const socket = block.sockets.find(
      s => s.direction === "input" && s.name === socketName
    );

    // if socket is invalid, return default value
    if (!socket) {return block.values?.[socketName]}

    // get connections for this socket
    const conns =
      this.project.getConnectionsForSocket(block.id, socket.id);
    // if no connections, return default value
    if (!conns.length) {return block.values?.[socketName]}

    // get the block where the connection is coming from
    const source = this.project.blocks.get(conns[0].from.blockId);
    // if no source block, return null
    if (!source) return null;

    // direct input (when there is no connection)
    if (source.values?.inputValue !== undefined) {
      if (source.definition?.type === "String") {
        return `"${source.values.inputValue}"`;
      }
      return source.values.inputValue;
    }

    // handle when the start block is get var, meaning its a variable type
    if (source.definition?.name === "VarGet") {
      return source.values?.variable;
    }

    return this.compileExpression(source);
  }

  //============================
  // FLOW CONNECTION HELPERS
  //============================

  getNextFlow(block) {
    // find the output flow socket
    const socket = block.sockets.find(
      s => s.direction === "output" && s.type === "flow"
    );
    // if no socket, return null
    if (!socket) return null;

    // get connections for this socket
    const conns =
      this.project.getConnectionsForSocket(block.id, socket.id);
    if (!conns.length) return null;

    // return the block where the connection is going to
    return this.project.blocks.get(conns[0].to.blockId);
  }

  getExecOutput(block, socketName) {
    // find the output flow socket with a name from parameter
    const socket = block.sockets.find(
      s => s.direction === "output" && s.name === socketName
    );
    if (!socket) return null;

    // get connections for this socket
    const conns =
      this.project.getConnectionsForSocket(block.id, socket.id);
    if (!conns.length) return null;

    // return the block where the connection is going to
    return this.project.blocks.get(conns[0].to.blockId);
  }

  //============================
  // CODE FORMATTING
  //============================

  indent(fn) {
    this.indentationLevel++;
    fn();
    this.indentationLevel--;
  }

  pushCode(line) {
    const indent = "  ".repeat(this.indentationLevel);
    this.lines.push(indent + line);
  }
}