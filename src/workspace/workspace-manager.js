import { Canvas } from "/src/workspace/canvas.js";
import { Catalogue } from "/src/workspace/catalogue.js";
import { LiveCode } from "/src/workspace/livecode.js";

import { translateBlockCode } from "/src/utils/translator.js"
import { initPyodideWorker, executePythonCode } from "/src/utils/pyodide.js";

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
  constructor() {
    this.initialiseComponents();
    this.translateCode();
  }

  // Initializes the components of the workspace
  initialiseComponents() {
    this.canvas = new Canvas('viewport')
    this.catalogue = new Catalogue('catalogue')
    this.livecode = new LiveCode('livecode')
  }

  // Translates block code to Python and executes it
  async translateCode() {
    const response = await fetch('/data/main.py');
    const pyFileText = await response.text(); // Returns the python code from main.py

    this.livecode.updateLiveCodeTranslation(pyFileText); // Update the LiveCode
    this.livecode.updateOutput("Running...");

    try {
      // Execute the translated Python code using Pyodide
      const pythonExecutionResult = await executePythonCode(pyFileText); // Execute python file

      // Update the output tab
      this.livecode.updateOutput(pythonExecutionResult || "(no output)");
      this.livecode.switchTabs("output"); // optional: automatically show OUTPUT tab
    } catch (e) {
      console.error(e);
      this.livecode.updateOutput(`Error:\n${e}`);
      this.livecode.switchTabs("output");
    }
  }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", async () => {
  await initPyodideWorker(); // Load Pyodide in background thread
  console.log("Pyodide ready!");

  new WorkspaceManager(); // rest of your app
});