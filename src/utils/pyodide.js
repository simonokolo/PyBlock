import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodideInstance;

async function initPyodide() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });

    // Override the input() function in Python
    pyodideInstance.globals.set("js_input", pyodideInput);
  }
  return pyodideInstance;
}

// Synchronous input handler
function pyodideInput(promptText = "") {
  const userInput = window.prompt(promptText || "Enter a value:");
  return userInput ?? "";
}

export async function executePythonCode(script) {
  const pyodide = await initPyodide();

  let output = "";
  pyodide.setStdout({
    batched: (msg) => {
      msg.split("\n").forEach(line => {
        if (line) output += line + "\n"; 
      });
    }
  });
  pyodide.setStderr({ batched: (err) => { output += "\n" + err; } });

  // Enter js_input into Python builtins
  const wrappedScript = `
import builtins
builtins.input = js_input
${script}
`;

  await pyodide.runPythonAsync(wrappedScript);
  return output.trim();
}
