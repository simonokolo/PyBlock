import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodideInstance;
let formattedScript;

async function initPyodide() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
  }
  return pyodideInstance;
}

function formatPythonFromTranslator(script) {
  // Replace '|' with spaces to ensure proper formatting
  script = script.replace(/\|>/g, " ");
  return script
}

// Function to execute Python code using Pyodide
export async function executePythonCode(script) {
  formattedScript = formatPythonFromTranslator(script);
  const pyodide = await initPyodide();

  // Capture stdout and stderr
  let output = "";
  pyodide.setStdout({
    batched: (msg) => {
      msg.split("\n").forEach(line => {
        if (line) output += line + "\n";   // collect instead of logging
      });
    }
  });

  pyodide.setStderr({ batched: (err) => { output += "\n" + err; } });

  // Run the Python code
  const response = await fetch('../js/utils/main.py');
  const pyFileText = await response.text();

  await pyodide.runPythonAsync(pyFileText);
  return output.trim();
}
