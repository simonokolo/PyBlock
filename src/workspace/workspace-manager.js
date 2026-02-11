import { BlockRegistry } from "/src/workspace/block-registry.js";
import { Project } from "/src/workspace/project.js";

import { Canvas } from "/src/workspace/canvas.js";
import { Catalogue } from "/src/workspace/catalogue.js";
import { LiveCode } from "/src/workspace/livecode.js";

import { exportBlocksToJSON, loadBlocksFromJSON, saveProjectToFirestore, loadAllProjectsFromFirestore, deleteProjcetFromFirestore } from "/src/save-system.js";
import { initPyodideWorker, executePythonCode } from "/src/utils/pyodide.js";
import { Translator } from '../utils/translator';

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
  constructor() {
    this.project = new Project();
    //window.project = this.project; // for debugging
    this.initialiseComponents();
    this.setupLiveCodeListeners();
    this.setupEventListeners();
    this.translateCode();
    this.updateUserProjectList();
  }

  async updateUserProjectList() {
    const userProjects = await loadAllProjectsFromFirestore(this.project);

    // Clear existing project list
    const projectListContainer = document.getElementById("project-list");
    projectListContainer.innerHTML = "";

    // Add a button for each project containing the name and delete button
    for (const project of userProjects) {
      const button = document.createElement("button");
      button.textContent = project.data.name;

      // Add a delete button next to the project name
      const deleteButton = document.createElement("span");
      deleteButton.textContent = "🗑️";
      deleteButton.style.marginLeft = "8px";
      deleteButton.style.cursor = "pointer";
      button.appendChild(deleteButton);

      // Add event listener for delete button
      deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent triggering the load event
        if (confirm(`Are you sure you want to delete the project "${project.data.name}"? This cannot be undone.`)) {
          try {
            await deleteProjcetFromFirestore(project.id);
            alert('Project deleted.');
            this.updateUserProjectList(); // refresh the list
          } catch (err) {
            console.error('Error deleting project:', err);
            alert('Failed to delete project. See console for details.');
          }
        }
      });

      button.addEventListener("click", async() => {
        await loadBlocksFromJSON(project.data.data, this.project);
        this.canvas.renderFromProject();
      });

      document.getElementById("project-list").appendChild(button);
    }
  }

  // Initializes the components of the workspace
  initialiseComponents() {
    this.canvas = new Canvas("viewport", this.project);
    //window.canvas = this.canvas; // for debugging ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
    this.catalogue = new Catalogue('catalogue')
    this.livecode = new LiveCode('livecode')
    this.translator = new Translator(this.project);
  }

  // Create event listeners for execute and translate
  setupLiveCodeListeners() {
    this.livecode.onExecute(() => {
      this.executeCode(); // Call execution logic
    });

    this.livecode.onTranslate(() => {
      this.translateCode(); // Call translation logic
    });
  }

  // Setup event listeners for saving project
  setupEventListeners() {
    document.getElementById("save-project-button").addEventListener("click", async () => {
      await saveProjectToFirestore(this.project);
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

    // new project (clear)
    document.getElementById("new-project-button").addEventListener("click", () => {
      if (confirm("Are you sure you want to clear the project? This cannot be undone.")) {
        this.project.clear();
        this.canvas.renderFromProject();
        this.canvas.centerViewport()
      }
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
    // Translate the project to Python and execute it
    const pyFileText = this.translator.translate(this.project);

    this.livecode.updateOutput("Running...");

    try {
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
    const code = this.translator.translate();
    this.livecode.updateLiveCodeTranslation(code);
  }
}

// Initialize the WorkspaceManager and BlockRegistry when the DOM is fully loaded
window.addEventListener("DOMContentLoaded", async () => {
  await initPyodideWorker();
  await BlockRegistry.init(); // definitions loaded once

  new WorkspaceManager();  
});
