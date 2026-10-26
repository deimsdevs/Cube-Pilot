import { serializeCubeState, deserializeCubeState } from '../core/cubeState.js';

export function exportState(state) {
  const url = URL.createObjectURL(new Blob([serializeCubeState(state)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'cubepilot-cube.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file) {
  return deserializeCubeState(await file.text()); // throws a readable error if the file is invalid
}
