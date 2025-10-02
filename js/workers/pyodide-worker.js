// Reserve Variables
let pyodide = null;
let pendingInputResolver = null;

// Worker message handler thats async to await pyodide
self.onmessage = async (event) => {
  const { type, code, userInput } = event.data; // Create the message schema

  // Runs only once when being initialised
  if (type === "init") { 
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");
    pyodide = await loadPyodide();

    // Expose a JS function to worker global so Python can call it through `from js import send_input_request`
    self.send_input_request = (prompt) => {
      self.postMessage({ type: "input_request", prompt }); // When awaiting an input, shows a prompt
      return new Promise((resolve) => {
        pendingInputResolver = resolve; // Allows the user to continue execution after entering an input
      });
    };

    // Replace Python's built-in input() with a function that calls the JS function above
    await pyodide.runPythonAsync(`
import builtins
from js import send_input_request
def _pyodide_input(prompt=""):
    return send_input_request(prompt)
builtins.input = _pyodide_input
    `); // Map JS inputs to Python inputs

    // Output and errors are sent to the main thread
    pyodide.setStdout({ batched: (s) => self.postMessage({ type: "stdout", text: s }) });
    pyodide.setStderr({ batched: (s) => self.postMessage({ type: "stderr", text: s }) });

    // Allows programs to be ran
    self.postMessage({ type: "ready" });
  }

  // Handles python code
  if (type === "run") {
    try {
      const result = await pyodide.runPythonAsync(code);
      // runPythonAsync returns the Python return value (converted to JS if possible)
      self.postMessage({ type: "result", result: String(result) }); // Send result
    } catch (err) {
      self.postMessage({ type: "error", error: err.message }); // Send errors
    }
  }

  // Handle user inputted text
  if (type === "input_response") {
    if (pendingInputResolver) {
      pendingInputResolver(userInput); // Resolves promise
      pendingInputResolver = null; // Clear
    }
  }
};
