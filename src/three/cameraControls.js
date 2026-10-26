import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Isometric start: Up, Front and Right faces are visible together.
export const DEFAULT_CAMERA = [4.2, 3.6, 5.2];

/** Camera orbit only. It never touches the logical cube state. */
export function createCameraControls(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 14;
  dom.style.touchAction = 'none'; // stops page scrolling while dragging the cube only
  const reset = () => { camera.position.set(...DEFAULT_CAMERA); controls.target.set(0, 0, 0); controls.update(); };
  dom.addEventListener('dblclick', reset);
  reset();
  return { controls, reset, update: () => controls.update() };
}
