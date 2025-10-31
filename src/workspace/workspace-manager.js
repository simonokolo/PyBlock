import { Canvas } from "/src/workspace/canvas.js";
import { Catalogue } from "/src/workspace/catalogue.js";
import { LiveCode } from "/src/workspace/livecode.js";


import { translateBlockCode } from "/src/utils/translator.js"
import { initPyodideWorker, executePythonCode } from "/src/utils/pyodide.js";

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
  constructor() {
    this.initialiseComponents();
    this.setupLiveCodeListeners();
    this.translateCode();
  }

  // Initializes the components of the workspace
  initialiseComponents() {
    this.canvas = new Canvas('viewport')
    this.catalogue = new Catalogue('catalogue')
    this.livecode = new LiveCode('livecode')
  }

  // Create event listeners for execute and translate
  setupLiveCodeListeners() {
    this.livecode.onExecute(() => {
      console.log("Execute button clicked!");
      this.executeCode(); // Call execution logic
    });

    this.livecode.onTranslate(() => {
      console.log("Translate button clicked!");
      this.translateCode(); // Call translation logic
    });
  }

  // Execute translated python code
  async executeCode() {
    // Get the current Python code
    const response = await fetch('/data/main.py');
    const pyFileText = await response.text();

    this.livecode.updateOutput("Running...");

    try {
      // Execute the Python code using Pyodide
      const pythonExecutionResult = await executePythonCode(pyFileText);
      this.livecode.updateOutput(pythonExecutionResult || "(no output)");
      this.livecode.switchTabs("output");
    } catch (e) {
      console.error(e);
      this.livecode.updateOutput(`Error:\n${e}`);
      this.livecode.switchTabs("output");
    }
  }

  // Translates block code
  async translateCode() {
    const response = await fetch('/data/main.py');
    const pyFileText = await response.text();

    this.livecode.updateLiveCodeTranslation(pyFileText);
  }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", async () => {
  await initPyodideWorker(); // Load Pyodide in background thread
  console.log("Pyodide ready!");

  new WorkspaceManager(); // rest of your app
});