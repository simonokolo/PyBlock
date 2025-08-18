import { checkAuthForAccountSettings } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuthForAccountSettings();

    // Add event listener for back button
    document.getElementById('back-button').addEventListener('click', function() {
        window.location.href = "workspace.html"
    })
})
