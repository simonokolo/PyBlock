import { auth, db } from '/src/firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

export function exportBlocksToJSON(project) {
  return JSON.stringify(project.serialize(), null, 2);
}

export async function loadBlocksFromJSON(json, project) {
  await project.deserialize(json);
}

// Save a project under to users projects
export async function saveProjectToFirestore(project) {
  if (!auth || !auth.currentUser) {
    alert('Not signed in.');
    return null;
  }

  const name = window.prompt('Enter a name for the project:', 'project...');
  if (name === null) return null; // cancelled

  const saveFile = {
    name: name || 'Untitled project',
    data: project.serialize(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const colRef = collection(db, 'users', auth.currentUser.uid, 'projects');
    // Add a new document with an generated ID
    const docRef = await addDoc(colRef, saveFile);
    alert('Project saved.');
    return { id: docRef.id, ref: docRef };
  } catch (err) {
    console.error('Error saving project:', err);
    alert('Failed to save project. See console for details.');
    return null;
  }
}

// load every user project to display in the load project menu
export async function loadAllProjectsFromFirestore(project) {
  if (!auth || !auth.currentUser) {
    alert('Not signed in.');
    return null;
  }

  // Get all projects for the current user
  const colRef = collection(db, 'users', auth.currentUser.uid, 'projects');
  const snapshot = await getDocs(colRef);

  const projects = [];
  snapshot.forEach((doc) => {
    projects.push({
      id: doc.id,
      data: doc.data()
    });
  });
  
  return projects;
}