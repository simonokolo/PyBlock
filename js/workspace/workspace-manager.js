import { Canvas } from "./canvas";
import { Catalogue } from "./catalogue";
import { LiveCode } from "./livecode";

// WorkspaceManager class to manage the workspace and its components
class WorkspaceManager {
    constructor() { 
        this.initialiseComponents();
    }

    // Initializes the components of the workspace
    initialiseComponents() {
        this.canvas = new Canvas('viewport')
        this.catalogue = new Catalogue('catalogue')
        this.livecode = new LiveCode('livecode')
    }
}

// Initialize the WorkspaceManager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkspaceManager();
})