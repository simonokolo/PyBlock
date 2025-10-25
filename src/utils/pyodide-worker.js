importScripts("https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js");

let pyodide;

self.onmessage = async (event) => {
  const { type, code } = event.data;

  if (type === "init") {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
    });

    // async js_input bridge
    pyodide.globals.set("js_input", async (promptText = "") => {
      return new Promise((resolve) => {
        const requestId = Math.random().toString(36).slice(2);
        const listener = (e) => {
          if (e.data.type === "input_response" && e.data.id === requestId) {
            self.removeEventListener("message", listener);
            resolve(e.data.value);
          }
        };
        self.addEventListener("message", listener);
        self.postMessage({
          type: "input_request",
          prompt: promptText,
          id: requestId,
        });
      });
    });

    self.postMessage({ type: "ready" });
    return;
  }

  if (type === "run") {
    try {
      let output = "";
      pyodide.setStdout({ batched: (msg) => (output += msg + "\n") });
      pyodide.setStderr({ batched: (err) => (output += err + "\n") });

      function indentCode(code, spaces = 4) {
        return code
          .split("\n")
          .map(line => (line.trim() ? " ".repeat(spaces) + line : line))
          .join("\n");
      }

      function awaitifyInput(src) {
        // Simple transform for generated code; fine if you're in control of the codegen
        return src.replace(/\binput\s*\(/g, 'await input(');
      }

      const transformed = awaitifyInput(code);

      const wrapped = `
import builtins, asyncio
builtins.input = js_input

async def __run():
${indentCode(transformed)}

await __run()
`;
      await pyodide.runPythonAsync(wrapped);
      self.postMessage({ type: "result", output: output.trim() });
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
  }
};
