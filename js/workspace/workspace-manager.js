import { Canvas } from "./canvas";
import { Catalogue } from "./catalogue";
import { LiveCode } from "./livecode";

import { } from "../utils/translator"

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
  constructor() {
    this.initialiseComponents();
    this.initWorker();
    this.translateCode(); 
  }

  // Create ui components
  initialiseComponents() {
    this.canvas = new Canvas('viewport');
    this.catalogue = new Catalogue('catalogue');
    this.livecode = new LiveCode('livecode');
  }

  // Create web worker
  initWorker() {
    // Create the worker
    this.worker = new Worker(
      new URL("./workers/pyodide-worker.js", import.meta.url),
      { type: "module" }
    );

    // Track when Pyodide is ready
    this.workerReady = false;
    this.pendingRuns = [];

    // Handle messages from worker
    this.worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "ready") {
        this.workerReady = true;
        // flush any queued code
        while (this.pendingRuns.length) {
          this.worker.postMessage(this.pendingRuns.shift());
        }
      }

      if (msg.type === "stdout") {
        this.livecode.updateOutput(msg.text); // send printed text to livecode output
      }

      if (msg.type === "stderr") {
        this.livecode.updateOutput("Error: " + msg.text);
      }

      if (msg.type === "input_request") {
        // Show input prompt in your terminal
        this.livecode.updateOutput(msg.prompt);

        // Wait for user to type something (you’ll need a UI hook)
        this.waitForUserInput().then((userInput) => {
          this.worker.postMessage({ type: "input_response", userInput });
        });
      }

      if (msg.type === "result") {
        this.livecode.updateOutput("=> " + msg.result);
      }

      if (msg.type === "error") {
        this.livecode.updateOutput("Error: " + msg.error);
      }
    };

    // Start the worker
    this.worker.postMessage({ type: "init" });
  }

  // Queue or run Python code
  runCode(code) {
    const payload = { type: "run", code };
    if (this.workerReady) {
      this.worker.postMessage(payload);
    } else {
      this.pendingRuns.push(payload);
    }
  }

  // Example method: wait for user typing
  waitForUserInput() {
    return new Promise((resolve) => {
      const inputEl = document.createElement("input");
      inputEl.type = "text";
      inputEl.placeholder = "Type input and press Enter";
      document.body.appendChild(inputEl);

      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const value = inputEl.value;
          document.body.removeChild(inputEl);
          resolve(value);
        }
      });
    });
  }

  // Fetch your Python file and run it
  async translateCode() {
    const response = await fetch('../js/utils/main.py');
    const pyFileText = await response.text();

    this.livecode.updateLiveCodeTranslation(pyFileText);

    // Instead of executePythonCode, send to worker
    this.runCode(pyFileText);
  }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new WorkspaceManager();
});
