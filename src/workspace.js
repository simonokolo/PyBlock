import { checkAuthForWorkspace, signUserOut } from '/src/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check for sign-in result
    checkAuthForWorkspace();

    // Add event listener for sign out
    document.getElementById('sign-out-button').addEventListener('click', signUserOut)

    // Add event listener for account settings
    document.getElementById('profile-settings-button').addEventListener('click', function() {
        window.location.href = "/pages/account-settings.html"
    })
})
