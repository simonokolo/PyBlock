import './firebase-config.js';
import { handleSignIn, handleSignUp, handleGoogleSignIn, checkGoogleSignInResult } from './auth.js';


document.addEventListener('DOMContentLoaded', () => {
    // Check for Google sign-in result
    checkGoogleSignInResult();

    // Add event listener to the sign-in form
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);

    // Add event listener to the sign-up form
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);

    // Add event listener to the Google sign-in button
    document.getElementById('continue-with-google').addEventListener('click', handleGoogleSignIn);
});

