let pyWorker;
let resultCallback = null;
let errorCallback = null;

export async function initPyodideWorker() {
  return new Promise((resolve) => {
    pyWorker = new Worker(new URL("./pyodide-worker.js", import.meta.url));

    // ✅ Use addEventListener so we don't overwrite this
    pyWorker.addEventListener("message", (event) => {
      const data = event.data;

      if (data.type === "ready") {
        resolve();
      }

      if (data.type === "input_request") {
        const value = window.prompt(data.prompt || "Enter a value:");
        pyWorker.postMessage({
          type: "input_response",
          id: data.id,
          value,
        });
      }

      if (data.type === "result" && resultCallback) {
        resultCallback(data.output);
      }

      if (data.type === "error" && errorCallback) {
        errorCallback(data.error);
      }
    });

    pyWorker.postMessage({ type: "init" });
  });
}

export async function executePythonCode(script) {
  return new Promise((resolve, reject) => {
    // ✅ Store callbacks instead of overwriting onmessage
    resultCallback = resolve;
    errorCallback = reject;

    pyWorker.postMessage({ type: "run", code: script });
  });
}
