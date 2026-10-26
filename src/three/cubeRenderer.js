import * as THREE from 'three';
import { FACELETS, FACES, indexAt } from '../core/cubeCoordinates.js';
import { DEFAULT_CENTERS } from '../core/cubeState.js';

const HEX = { W: 0xf4f4f4, Y: 0xffd500, R: 0xc41e3a, O: 0xff6a00, B: 0x0051ba, G: 0x009b48, EMPTY: 0x3a4152 };
const colorOf = (sym) => HEX[sym] ?? HEX[DEFAULT_CENTERS[sym]] ?? HEX.EMPTY; // accepts color keys or face letters

export function createCubeRenderer() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const stickerGeo = new THREE.BoxGeometry(0.82, 0.82, 0.03);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0d0f14, roughness: 0.7 });
  const mats = new Map();
  const material = (hex, hl) => {
    const k = `${hex}:${hl}`;
    if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, emissive: hl ? hex : 0x000000, emissiveIntensity: hl ? 0.45 : 0 }));
    return mats.get(k);
  };

  const cubieByPos = new Map();
  const cubies = [];
  const stickers = [];
  for (const f of FACELETS) {
    const k = f.pos.join(',');
    if (!cubieByPos.has(k)) {
      const c = new THREE.Mesh(bodyGeo, bodyMat);
      c.userData.home = f.pos.slice();
      c.position.set(...f.pos);
      group.add(c);
      cubieByPos.set(k, c);
      cubies.push(c);
    }
    const s = new THREE.Mesh(stickerGeo, material(HEX.EMPTY, false));
    const n = new THREE.Vector3(...f.normal);
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    s.position.copy(n).multiplyScalar(0.49);
    s.userData = { localNormal: n, home: f.index, symbol: null };
    cubieByPos.get(k).add(s);
    stickers.push(s);
  }

  let highlighted = null;
  const paint = (s) => {
    const hl = highlighted !== null && FACELETS[currentIndex(s)].face === highlighted;
    s.material = material(colorOf(s.userData.symbol), hl);
  };

  function currentIndex(s) {
    const c = s.parent;
    c.updateMatrixWorld(true);
    const pos = c.position.toArray().map(Math.round);
    const nrm = s.userData.localNormal.clone().applyQuaternion(c.quaternion).toArray().map(Math.round);
    return indexAt(pos.map((v) => v + 0), nrm.map((v) => v + 0));
  }

  return {
    group, cubies, stickers,
    /** Reset geometry to the rest pose and paint 54 symbols (color keys, face letters or null). */
    setState(state) {
      for (const c of cubies) { c.position.set(...c.userData.home); c.quaternion.identity(); }
      stickers.forEach((s) => { s.userData.symbol = state[s.userData.home]; paint(s); });
    },
    /** Read the 54-entry state back from the rendered geometry. */
    readState() {
      const out = new Array(54).fill(null);
      for (const s of stickers) out[currentIndex(s)] = s.userData.symbol;
      return out;
    },
    indexOfSticker: currentIndex,
    setHighlightFace(face) {
      if (face !== null && !FACES.includes(face)) throw new Error(`Unknown face: ${face}`);
      highlighted = face;
      stickers.forEach(paint);
    },
    dispose() {
      bodyGeo.dispose(); stickerGeo.dispose(); bodyMat.dispose(); mats.forEach((m) => m.dispose());
    }
  };
}
