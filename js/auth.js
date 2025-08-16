import 
{ signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut
} from "firebase/auth";

import { auth, provider } from './firebase-config.js';

// Function to handle sign-in
export function handleSignIn(event) {
    event.preventDefault(); // Cancel form submission

    //Get email and password from the form
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    // Sign in with Firebase Authentication
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
        console.log("Signed in")
        const user = userCredential.user;
        window.location.href = '/pages/workspace.html';
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    });
}

// Function to handle sign-up
export function handleSignUp(event) {
    event.preventDefault(); // Cancel form submission

    // Get email and password from the form
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    // Sign up with Firebase Authentication
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
        console.log("Signed up")
        const user = userCredential.user;
        window.location.href = '/pages/workspace.html';
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    });
}

// Function to handle Google sign-in
export function handleGoogleSignIn() {
    console.log("=== GOOGLE SIGN-IN DEBUG ===");
    console.log("Current origin:", window.location.origin);
    console.log("Auth config:", auth.app.options);
    console.log("Provider:", provider);
    
    // Let's see what happens if we manually set some provider options
    provider.setCustomParameters({
        'redirect_uri': window.location.origin,
        'prompt': 'select_account'
    });
    
    console.log("Modified provider:", provider);
    
    signInWithRedirect(auth, provider)
        .then(() => {
            console.log("signInWithRedirect promise resolved");
        })
        .catch((error) => {
            console.error("signInWithRedirect error:", error);
        });
}

// Authentication for the index page
export function checkAuthForIndex() {

    console.log("=== ENHANCED DEBUG INFO ===");
    console.log("Current URL:", window.location.href);
    console.log("URL search params:", window.location.search);
    console.log("Auth current user:", auth.currentUser);
    console.log("Auth app options:", auth.app.options);
    
    // Check if there are any errors in the URL
    const urlParams = new URLSearchParams(window.location.search);
    console.log("All URL params:", Object.fromEntries(urlParams));

    getRedirectResult(auth).then((result) => {
        console.log("getRedirectResult result:", result);
        if (result) {
            console.log("Signed in")
            // Redirect if signed in
            const user = result.user;
            window.location.href = '/pages/workspace.html'
            return;
        }
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Redirect if signed in
                console.log("(Persistent) Signed in")
                window.location.href = '/pages/workspace.html'
            } else {
                console.log("No user is signed in");
            }
        });
    })
    .catch((error) => {
        console.error("ERROR:", error.code, error.message);
    });
}

export function checkAuthForWorkspace() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Redirect if NOT signed in
            console.log("No user is signed in");
            window.location.href = '/index.html';
        } //No need to do anything if user is authorised
    });
}

// Function to send password reset email
export function sendEmailVerification(event) {
    event.preventDefault(); // Cancel form submission
    
    const email = document.getElementById('forgot-password-email').value;

    sendPasswordResetEmail(auth, email).then(() => {
        console.log("Password reset email sent");
    })
    .catch((error) => {
        console.error(error.code, error.message);
    });
}

export function signUserOut() {
    signOut(auth).then(() => {
        console.log("signed out")
    }).catch((error) => {
        console.log("sign out error")
    })
}