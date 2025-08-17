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


/**
 * ---------------------------
 * AUTHENTICATION FUNCTIONS
 * ---------------------------
 */

// Sign In (email/password)
export function handleSignIn(event) {
  event.preventDefault();
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

  return signInWithEmailAndPassword(auth, email, password)
    .then(() => console.log("Signed in"))
    .catch((err) => console.error("Sign-in error:", err.code, err.message));
}

// Sign Up (email/password)
export function handleSignUp(event) {
  event.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  return createUserWithEmailAndPassword(auth, email, password)
    .then(() => console.log("Signed up"))
    .catch((err) => console.error("Sign-up error:", err.code, err.message));
}

// Google Sign-In
export function handleGoogleSignIn() {
  return signInWithPopup(auth, provider)
    .then(() => console.log("Google sign-in successful"))
    .catch((err) => console.error("Google sign-in error:", err.code, err.message));
}

// Send Password Reset Email
export function sendPasswordReset(event) {
  event.preventDefault();
  const email = document.getElementById("forgot-password-email").value;

  return sendPasswordResetEmail(auth, email)
    .then(() => console.log("Password reset email sent"))
    .catch((err) => console.error("Password reset error:", err.code, err.message));
}

// Sign Out
export function signUserOut() {
  return signOut(auth)
    .then(() => console.log("Signed out"))
    .catch((err) => console.error("Sign out error:", err));
}

/**
 * ---------------------------
 * AUTH STATE CHECKS
 * ---------------------------
 */

// Index Page Auth
export function checkAuthForIndex() {
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        console.log("Sign In Via Redirect:", result.user.email);
        window.location.href = "/pages/workspace.html";
      }
    })
    .catch((error) => console.error("Redirect error:", error));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Sign In:", user.email);
      window.location.href = "/pages/workspace.html";
    } else {
      console.log("No user signed in");
    }
  });
}

// Workspace Page Auth
export function checkAuthForWorkspace() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("No user signed in");
      window.location.href = "/index.html";
    } else {
      console.log("User signed in :", user.email);
      console.log(user)

      // Update account elements
      document.getElementById('profile-username').textContent = user.displayName;
      document.getElementById('profile-username-dropdown').textContent = user.displayName;
      document.getElementById('profile-email').textContent = user.email;
      document.getElementById('small-profile-picture').src = user.photoURL;
      document.getElementById('large-profile-picture').src = user.photoURL;
    }
  });
}

//Account settings page auth
export function checkAuthForAccountSettings() {
  onAuthStateChanged(auth, (user) => {
    if(!user) {
      console.log("No user signed in")
      window.location.href = "/index.html";
    } else {

      //Update elements
      document.getElementById('user-profile-picture').src = user.photoURL;
      document.getElementById('change-username').value = user.displayName;
      document.getElementById('change-email').value = user.email;
    }
  })
}