import { Canvas } from "./canvas";

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
    constructor() {
        this.initializeComponents();
    }

    // Initializes the components of the workspace
    initializeComponents() {
        this.canvas = new Canvas('viewport')
    }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkspaceManager();
})