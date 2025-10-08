import '/src/firebase-config.js';
import { handleSignIn, handleSignUp, handleGoogleSignIn, checkAuthForIndex, sendPasswordReset } from '/src/auth.js';


document.addEventListener('DOMContentLoaded', () => {
    // Check for sign-in result
    checkAuthForIndex();

    // Add event listener to the sign-in form
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);

    // Add event listener to the sign-up form
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);

    // Add event listener to the Google sign-in button
    document.getElementById('continue-with-google').addEventListener('click', handleGoogleSignIn);

    // Add event listener to the password reset button
    document.getElementById('forgot-password-form').addEventListener('submit', sendPasswordReset);
});
