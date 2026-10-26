/** Main-thread client. Solving runs in a Web Worker so the interface never freezes. */
export function createSolver() {
  let worker = null, nextId = 1;
  const pending = new Map();

  function fail(message) {
    pending.forEach((p) => { clearTimeout(p.timer); p.reject(new Error(message)); });
    pending.clear();
    if (worker) { worker.terminate(); worker = null; }
  }
  function start() {
    if (worker) return;
    worker = new Worker(new URL('./solverWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, moves, error, ready } = e.data;
      const p = pending.get(id);
      if (!p) return;
      clearTimeout(p.timer); pending.delete(id);
      if (error) p.reject(new Error(error)); else p.resolve(ready ? true : moves);
    };
    worker.onerror = () => fail('The solver failed to start. Reload the page and try again.');
  }
  function request(payload) {
    return new Promise((resolve, reject) => {
      try { start(); } catch (err) { return reject(new Error('Your browser could not start the solver worker.')); }
      const id = nextId++;
      const timer = setTimeout(() => fail('Solving took too long. Please check your cube and try again.'), 90000);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, ...payload });
    });
  }
  return {
    warmUp: () => request({ init: true }).catch(() => {}),
    solve: (facelets) => request({ facelets })
  };
}
