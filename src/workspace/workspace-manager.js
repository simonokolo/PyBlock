import { BlockRegistry } from "/src/workspace/block-registry.js";
import { Project } from "/src/workspace/project.js";

import { Canvas } from "/src/workspace/canvas.js";
import { Catalogue } from "/src/workspace/catalogue.js";
import { LiveCode } from "/src/workspace/livecode.js";

import { exportBlocksToJSON, loadBlocksFromJSON } from "/src/save-system.js";
import { translateBlockCode } from "/src/utils/translator.js"
import { initPyodideWorker, executePythonCode } from "/src/utils/pyodide.js";

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
  constructor() {
    this.project = new Project();
    //window.project = this.project; // for debugging
    this.initialiseComponents();
    this.setupLiveCodeListeners();
    this.setupEventListeners();
    this.translateCode();
  }

  // Initializes the components of the workspace
  initialiseComponents() {
    this.canvas = new Canvas("viewport", this.project);
    window.canvas = this.canvas; // for debugging ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
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

  // Setup event listeners for saving project
  setupEventListeners() {
    document.getElementById("save-project-button").addEventListener("click", () => {
      const json = exportBlocksToJSON(this.project);
      console.log(json);
    });

    // download json
    document.getElementById("download-project-button").addEventListener("click", () => {
      const json = exportBlocksToJSON(this.project);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    // upload json
    document.getElementById("upload-project-button").addEventListener("click", () => {
      document.getElementById("upload-project-input").click();
    });

    // handle file input change
    document.getElementById("upload-project-input").addEventListener("change", async (event) => {
      // Get the selected file
      const file = event.target.files[0];

      if (file) {
        // Read the file contents
        const reader = new FileReader();
        // On file load
        reader.onload = async () => {
          console.log("File contents:", reader.result);
          await loadBlocksFromJSON(reader.result, this.project);
          // re-render the canvas from the newly loaded project
          this.canvas.renderFromProject();
        };

        reader.readAsText(file);
      }
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

// Initialize the WorkspaceManager and BlockRegistry when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", async () => {
  await initPyodideWorker();
  await BlockRegistry.init(); // definitions loaded once

  new WorkspaceManager();
});
