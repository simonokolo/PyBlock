import 
{ signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithRedirect,
    signInWithPopup,
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
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user
        console.log("Signed in")
    }).catch((error) => {
        console.log(error.code, error.message)
    })
}

// Authentication for the index page
export function checkAuthForIndex() {
    // Check if there are any errors in the URL
    const urlParams = new URLSearchParams(window.location.search);

    getRedirectResult(auth).then((result) => {
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