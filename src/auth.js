import 
{ signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  reauthenticateWithCredential,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword, 
  deleteUser,
  signOut
} from "firebase/auth";

import { auth, provider, db } from '/src/firebase-config.js';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { digestMessage } from '/src/utils/hash.js'

/**
 * ---------------------------
 * AUTHENTICATION FUNCTIONS
 * ---------------------------
*/

// Create or update a Firestore user document for a newly created/signed-in user
async function createUserDocument(user) {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);

  try {
    console.log("Attempting to write user doc for:", user.uid);
    await setDoc(userRef, { createdAt: serverTimestamp() }, { merge: true });
    console.log('User document written for', user.uid);
  } catch (err) {
    console.error('Error writing user doc:', err);
  }
}

// Sign In (email/password)
export function handleSignIn(event) {
  event.preventDefault();
  const email = document.getElementById("signin-email").value.trim();
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

    // Create Firestore user entry
    await createUserDocument(user);

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
    .then(async (result) => {
      try {
        const user = result.user;
        await createUserDocument(user);
        console.log("Google sign-in successful");
      } catch (err) {
        console.error("Google sign-in post-processing error:", err);
      }
    })
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

/*
 * ---------------------------
 * ACCOUNT FUNCTIONS
 * ---------------------------
*/

// Update the users displayName
export async function updateUserProfile(event) {
  event.preventDefault();
  // Retrieve the value in the username input box
  const newUsername = document.getElementById("change-username").value.trim();

  try {
    await updateProfile(auth.currentUser, { displayName: newUsername });
    await auth.currentUser.reload(); // Refresh auth to show the new changes

    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Error updating profile:", err);
  }
}

// Update the users password
export function updateUserPassword(event) {
  event.preventDefault();

  // Get both inputted passwords from the page
  const newPassword = document.getElementById('new-password').value
  const confirmPassword = document.getElementById('confirm-password').value

  //If they dont match then alert the user and dont allow them to continue
  if (newPassword !== confirmPassword) {
    console.warn("Passwords don't match")
    alert("Passwords do not match")
    return;
  }

  // Update the password
  updatePassword(auth.currentUser, newPassword).then(() => {
    console.log("Password Updated")
    alert("Password updated successfully!")
  }).catch((err) => {
    console.warn(err.code, err.message)

    // Check if error code is the reauthentication error
    if (err.code === "auth/requires-recent-login") {
      document.getElementById('authentication-popup').classList.add("active");
    } else {
      alert(err.message)
    }
  })
}

import { EmailAuthProvider } from "firebase/auth";

export async function reauthenticateUser(event) {
  event.preventDefault();

  // Get contents of inputs on the popup
  const authEmail = document.getElementById('authentication-email').value.trim()
  const authPassword = document.getElementById('authentication-password').value

  // Create the credential
  const credential = EmailAuthProvider.credential(authEmail, authPassword)

  await reauthenticateWithCredential (auth.currentUser, credential).then(() => {
    console.log("User ReAuthenticated")
    document.getElementById('authentication-popup').classList.remove("active");
  })
  .catch((err) => {
    alert("Reauthentication failed. Please try again.")
    console.error(err.code, err.message)
  })
}

// Generate a deletion code for account deletion
export const generateDeletionCode = () => {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000);
  // Display the code in the deletion code element
  document.getElementById('deletion-code').textContent = `Enter the code ${code} below to delete:`;
  return code;
}

// Delete users account
export async function deleteAccount() {
  deleteUser(auth.currentUser).then(() => {
    alert("Deleted Account")
  }).catch((err) => {
    console.warn(err.code, err.message)

    // Check if error code is the reauthentication error
    if (err.code === "auth/requires-recent-login") {
      document.getElementById('authentication-popup').classList.add("active");
    } else {
      alert(err.message)
    }
  })
}
