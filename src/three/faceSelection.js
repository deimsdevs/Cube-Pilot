import * as THREE from 'three';
import { FACELETS } from '../core/cubeCoordinates.js';

/**
 * Nearest thing under the ray. Cubie bodies are tested too, so a tap on the dark gap
 * between stickers hits the body and selects nothing, instead of passing through the cube
 * and wrongly selecting a hidden sticker on the far side.
 */
export function pickFacelet(raycaster, cube) {
  const hit = raycaster.intersectObjects([...cube.cubies, ...cube.stickers], false)[0];
  if (!hit || !hit.object.userData.localNormal) return null;
  return FACELETS[cube.indexOfSticker(hit.object)];
}

/** Click (not drag) on a sticker to select its facelet; clicking empty space selects null. */
export function createFaceSelector(dom, camera, cube, onSelect) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  const onDown = (e) => { down = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    onSelect(pickFacelet(ray, cube));
  };
  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointerup', onUp);
  return () => { dom.removeEventListener('pointerdown', onDown); dom.removeEventListener('pointerup', onUp); };
}
