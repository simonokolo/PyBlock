import 
{ signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    getRedirectResult,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    signOut
} from "firebase/auth";

import { auth, provider } from './firebase-config.js';
import { digestMessage } from './utils/hash.js'


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
export async function handleSignUp(event) {
  event.preventDefault();
  const email = document.getElementById("signup-email").value.toLowerCase();
  const password = document.getElementById("signup-password").value;
  const displayName = document.getElementById("signup-username").value;

  try {
    // Create flag to prevent immediate redirect from OnAuthStateChanged
    sessionStorage.setItem("accountUpdatePending", "1");
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    const emailHash = await digestMessage(email);
    const gravatarURL = `https://www.gravatar.com/avatar/${emailHash}?d=wavatar`

    // Added async await to ensure that the program waits for the promise before continuing
    await updateProfile(user, { 
      displayName,
      photoURL : gravatarURL 
    });
    await user.reload(); // Clears old user cache

    // Clears flag to allow OnAuthStateChanged to redirect
    sessionStorage.removeItem("accountUpdatePending");
    window.location.href = "/pages/workspace.html";
  } catch (error) {
    sessionStorage.removeItem("accountUpdatePending");
    console.error("Signup error", error.code, error.message);
  }
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
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (sessionStorage.getItem("accountUpdatePending") === "1") {
        return 
      }
      window.location.href = "/pages/workspace.html";
    }
  });
}

// Workspace Page Auth
export function checkAuthForWorkspace() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/index.html";
      return;
    } 

    // Update account elements
    document.getElementById('profile-username').textContent = user.displayName;
    document.getElementById('profile-username-dropdown').textContent = user.displayName;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('small-profile-picture').src = user.photoURL;
    document.getElementById('large-profile-picture').src = user.photoURL;
  });
}

//Account settings page auth
export function checkAuthForAccountSettings() {
  onAuthStateChanged(auth, (user) => {
    if(!user) {
      window.location.href = "/index.html";
    }
    
    //Update elements
    document.getElementById('user-profile-picture').src = user.photoURL;
    document.getElementById('change-username').value = user.displayName;
    document.getElementById('change-email').value = user.email;
  })
}

/**
 * ---------------------------
 * ACCOUNT FUNCTIONS
 * ---------------------------
 */

function updateUserProfile () {
  updateProfile(auth.currentUser, {
    displayName: "Jane Q. User", photoURL: "https://example.com/jane-q-user/profile.jpg"
  }).then(() => {
    console.log("profile updated")
    // Profile updated!
    // ...
  }).catch((error) => {
    // An error occurred
    // ...
  });
}