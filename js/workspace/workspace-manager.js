import { Canvas } from "./canvas";
import { Catalogue } from "./catalogue";
import { LiveCode } from "./livecode";

import { translateBlockCode } from "../utils/translator"
import { executePythonCode } from "../utils/pyodide"

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
    const response = await fetch('../js/utils/main.py');
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
document.addEventListener('DOMContentLoaded', () => {
  new WorkspaceManager();
})