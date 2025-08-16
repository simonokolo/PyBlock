import { checkAuthForWorkspace, signUserOut } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check for sign-in result
    checkAuthForWorkspace();

    // Add event listener for sign out
    document.getElementById('sign-out-button').addEventListener('click', signUserOut)
})