import * as THREE from 'three';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(5, 8, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.7); fill.position.set(-6, -3, -5); scene.add(fill);

  const frameHooks = [];
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); // CSS sizes the canvas; fixed pixel styles caused sideways scrolling
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  renderer.setAnimationLoop(() => { frameHooks.forEach((f) => f()); renderer.render(scene, camera); });

  return {
    scene, camera, renderer,
    onFrame: (fn) => frameHooks.push(fn),
    dispose() { ro.disconnect(); renderer.setAnimationLoop(null); renderer.dispose(); renderer.domElement.remove(); }
  };
}
