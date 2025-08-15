import 
{ signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged
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
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
    });
}

// Function to handle Google sign-in
export function handleGoogleSignIn() {
    signInWithRedirect(auth, provider);
}

// Function to check Google sign-in result
export function checkGoogleSignInResult() {
    //Handle immediate redirect result
    getRedirectResult(auth)
        .then((result) => {
            if (result) {
                console.log("Signed in")
            }
        })
        .catch((error) => {
            console.error("Redirect sign-in error:", error.code, error.message);
        });

    //Handle already signed-in users
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("(Persistent) Signed in")
        } else {
            console.log("No user is signed in");
        }
    });
}

