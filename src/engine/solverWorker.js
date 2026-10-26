import { initSolver, solveFacelets } from './solverCore.js';

self.onmessage = (e) => {
  const { id, init, facelets } = e.data;
  try {
    if (init) { initSolver(); self.postMessage({ id, ready: true }); return; }
    self.postMessage({ id, moves: solveFacelets(facelets) });
  } catch (err) {
    self.postMessage({ id, error: err.message || 'Solver error' });
  }
};
