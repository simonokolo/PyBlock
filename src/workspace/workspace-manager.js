import { Canvas } from "/src/workspace/canvas.js";
import { Catalogue } from "/src/workspace/catalogue.js";
import { LiveCode } from "/src/workspace/livecode.js";

import { translateBlockCode } from "/src/utils/translator.js"
import { executePythonCode } from "/src/utils/pyodide.js"

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

    this.livecode.updateLiveCodeTranslation(pyFileText) // Update the LiveCode
    this.livecode.updateOutput("Running...")
    try {
      // Execute the translated Python code using Pyodide
      const pythonExecutionResult = await executePythonCode(pyFileText); // Execute python file
      console.log(pythonExecutionResult)
    } catch (e) {
      console.error(e)
    }
  }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  new WorkspaceManager();
})
