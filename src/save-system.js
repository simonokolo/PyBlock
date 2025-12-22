export function exportBlocksToJSON(project) {
  return JSON.stringify(project.serialize(), null, 2);
}

export async function loadBlocksFromJSON(json, project) {
  await project.deserialize(json);
}
