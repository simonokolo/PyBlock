import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodideInstance;

async function initPyodide() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
  }
  return pyodideInstance;
}

// Function to execute Python code using Pyodide
export async function executePythonCode(script) {
  const pyodide = await initPyodide();

  // Capture stdout and stderr
  let output = "";
  pyodide.setStdout({
    batched: (msg) => {
      msg.split("\n").forEach(line => {
        if (line) console.log(line);    // Shouldnt be getting printed here
      });
    }
  });

  pyodide.setStderr({ batched: (err) => { output += "\n" + err; } });

  // Run the Python code
  await pyodide.runPythonAsync(script);
  return output.trim();
}
