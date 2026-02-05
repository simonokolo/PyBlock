export class Block {
  constructor(projectBlock) {
    this.data = projectBlock; // reference to Project.js
    this.element = this.createElement();
    this.selected = false;
    this.setupEventListeners();
  }

  setSelected(state) {
    this.selected = state;
    this.element.classList.toggle("selected", state);
  }

  createElement() {
    const { definition } = this.data;

    const div = document.createElement("div");
    div.className = "node";
    div.dataset.type = definition.type; // Changed from 'name' to 'type' to fix block colouring

    div.innerHTML = `
      <div class="block-label">
        <span>${definition.name}</span>
      </div>
      <div class="block-padding"></div>
      <div class="block-io">
        <div class="inputs"></div>
        <div class="content"></div>
        <div class="outputs"></div>  
      </div>
    `;

    // Inputs: render from the block instance sockets
    const inputContainer = div.querySelector(".inputs");
    (this.data.sockets || []).filter(s => s.direction === "input").forEach(s => {
      const socket = document.createElement("div");

      // class includes the socket type so css can color it: .socket.type-string etc.
      socket.className = `socket input type-${s.type}`;
      socket.dataset.direction = s.direction;
      socket.dataset.type = s.type;
      socket.dataset.index = s.index;
      socket.dataset.blockId = this.data.id;
      socket.dataset.socketId = s.id;
      socket.title = s.name;

      inputContainer.appendChild(socket);
    });

    // Outputs: render from the block instance sockets
    const outputContainer = div.querySelector(".outputs");
    (this.data.sockets || []).filter(s => s.direction === "output").forEach(s => {
      const socket = document.createElement("div");

      socket.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();

        // notify canvas
        document.dispatchEvent(
          new CustomEvent("start-connection-drag", {
            detail: {
              blockId: this.data.id,
              socketId: s.id
            }
          })
        );
      });

      socket.className = `socket output type-${s.type}`;
      socket.dataset.direction = s.direction;
      socket.dataset.type = s.type;
      socket.dataset.index = s.index;
      socket.dataset.blockId = this.data.id;
      socket.dataset.socketId = s.id;
      socket.title = s.name;

      outputContainer.appendChild(socket);
    });

    // Contents (unchanged)
    const contentContainer = div.querySelector(".content");
    (definition.contents || []).forEach((content) => {
      const el = document.createElement(
        content.type === "dropdown" ? "select" : "input"
      );

      // mark which content the element represents
      el.dataset.contentName = content.name;

      el.className = "content-item";
      // populate dropdown options when provided
      if (content.type === "dropdown") {
        console.log(content.options);

        // populate dropdown options according to the content definition
        const options = content.options || [];
        options.forEach(o => {
          const option = document.createElement("option");
          option.value = o;
          option.textContent = o;
          el.appendChild(option);
        });
      }

      // set initial value after options have been added so it picks the right value
      el.value = this.data.values?.[content.name] ?? content.default ?? "";

      // ensure the block instance stores the default value
      if (this.data.values == null) this.data.values = {};
      if (this.data.values[content.name] == null) {
        this.data.values[content.name] = el.value;
      }

      // listen for changes to update the block instance data
      el.addEventListener("change", () => {
        this.data.values[content.name] = el.value;

        // If block is VarCreate and the user entered a name, dispatch event to create/update the variable in the project
        if (content.name === 'name' && this.data.definition?.name === 'VarCreate') {
          const varName = el.value;
          const varType = this.data.values?.datatype || 'any';

          const socket = (this.data.sockets || []).find(s => s.direction === "output" && s.name === "value");
          if (socket) {
            // set socket type according to variable type
            const mapped = (varType === "integer" || varType === "boolean" || varType === "string" || varType === "float") ? varType : "any";
            socket.type = mapped;

            // update DOM socket element if present
            const socketEl = document.querySelector(`.socket[data-block-id="${this.data.id}"][data-socket-id="${socket.id}"]`);
            if (socketEl) {
              // remove existing datatype classes
              [...socketEl.classList].filter(c => c.startsWith("type-")).forEach(c => socketEl.classList.remove(c));
              socketEl.classList.add(`type-${mapped}`);
              socketEl.dataset.type = mapped;
            }
          }
          document.dispatchEvent(new CustomEvent('project-create-variable', { detail: { name: varName, type: varType } }));
        }

        // handling for Input block datatype dropdown
        if (content.name === "datatype" && this.data.definition?.name === "Input") {
          const val = el.value; // string or int
          const socket = (this.data.sockets || []).find(s => s.direction === "output" && s.name === "value");
          if (socket) {
            const socketType = (val === "integer" || val === "boolean" || val === "float" || val === "string") ? val : "string";
            socket.type = socketType;

            // update DOM socket element if present
            const socketEl = document.querySelector(`.socket[data-block-id="${this.data.id}"][data-socket-id="${socket.id}"]`);
            if (socketEl) {
              // remove existing datatype classes
              [...socketEl.classList].filter(c => c.startsWith("type-")).forEach(c => socketEl.classList.remove(c));
              socketEl.classList.add(`type-${socketType}`);
              socketEl.dataset.type = socketType;
            }
          }

          // cast value code
          if (val === "integer") {
            this.data.definition.code = "int(input())";
          } else {
            this.data.definition.code = "input()";
          } 
        }

        // If varcreate datatype changed, dispatch event
        if (content.name === 'datatype' && this.data.definition?.name === 'VarCreate') {
          const varName = this.data.values?.name || '';
          const varType = el.value || 'any';
          if (varName) {
            document.dispatchEvent(new CustomEvent('project-create-variable', { detail: { name: varName, type: varType } }));
          }

          // also update output socket type
          const socket = (this.data.sockets || []).find(s => s.direction === "output" && s.name === "value");
          if (socket) {
            const mapped = (varType === "integer" || varType === "boolean" || varType === "string" || varType === "float") ? varType : "any";
            socket.type = mapped;

            // update DOM socket element if present
            const socketEl = document.querySelector(`.socket[data-block-id="${this.data.id}"][data-socket-id="${socket.id}"]`);
            if (socketEl) {
              // remove existing datatype classes
              [...socketEl.classList].filter(c => c.startsWith("type-")).forEach(c => socketEl.classList.remove(c));
              socketEl.classList.add(`type-${mapped}`);
              socketEl.dataset.type = mapped;
            }
          }
        }

        // dropdown handling for VarSet and VarGet 
        if (content.name === "variable") {
          // selected option might carry a datatype on the option element if populated by Canvas
          const selectedOpt = el.options[el.selectedIndex];
          const varName = el.value;
          const varType = selectedOpt?.dataset?.type || null;

          // VarSet - change the input socket type to the variable datatype
          if (this.data.definition?.name === "VarSet") {
            const socket = (this.data.sockets || []).find(s => s.direction === "input" && s.name === "value");
            if (socket) {
              const mapped = (varType === "integer" || varType === "boolean" || varType === "string" || varType === "float") ? varType : (varType ?? "any");
              socket.type = mapped;
              const socketEl = document.querySelector(`.socket[data-block-id="${this.data.id}"][data-socket-id="${socket.id}"]`);
              if (socketEl) {
                [...socketEl.classList].filter(c => c.startsWith("type-")).forEach(c => socketEl.classList.remove(c));
                socketEl.classList.add(`type-${mapped}`);
                socketEl.dataset.type = mapped;
              }
            }

            // set code to variable assignment
            this.data.definition.code = `${varName} = ""`;
          }

          // VarGet - change the output socket type and code
          if (this.data.definition?.name === "VarGet") {
            const socket = (this.data.sockets || []).find(s => s.direction === "output");
            if (socket) {
              const mapped = (varType === "integer" || varType === "boolean" || varType === "string" || varType === "float") ? varType : (varType ?? "any");
              socket.type = mapped;
              const socketEl = document.querySelector(`.socket[data-block-id="${this.data.id}"][data-socket-id="${socket.id}"]`);
              if (socketEl) {
                [...socketEl.classList].filter(c => c.startsWith("type-")).forEach(c => socketEl.classList.remove(c));
                socketEl.classList.add(`type-${mapped}`);
                socketEl.dataset.type = mapped;
              }
            }

            // set code to the variable name
            this.data.definition.code = varName;
          }
        }
      });

      contentContainer.appendChild(el);
    });

    return div;
  }

  setupEventListeners() {
    this.element.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      e.stopPropagation();
    });
  }

  // update dropdowns for project variables
  updateVariableOptions(variables) {
    const selects = this.element.querySelectorAll('select.content-item');
    selects.forEach(sel => {
      const contentName = sel.dataset.contentName;
      if (contentName !== 'variable') return;

      // remember selected value
      const prev = sel.value;

      // clear existing
      sel.innerHTML = '';

      // add empty option
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = '';
      sel.appendChild(empty);

      // add new options
      variables.forEach(v => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = v.name;
        o.dataset.type = v.type;
        sel.appendChild(o);
      });

      // restore previous selection if still present
      if (prev) sel.value = prev;
    });
  }
}
