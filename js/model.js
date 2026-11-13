// Loads the shoulder model and its annotations, and gives each part its look.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const GHOST = { color: 0xb8c4d6, transparent: true, opacity: 0.16, depthWrite: false, roughness: 0.6 };

const MATERIALS = {
  'Scapula': () => new THREE.MeshStandardMaterial({ color: 0xe6dcc4, roughness: 0.75, metalness: 0 }),
  'Fracture line': () => new THREE.MeshBasicMaterial({ color: 0xff2a1f }),
  'Fracture surface': () => new THREE.MeshBasicMaterial({ color: 0xff2a1f, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
  'Humerus': () => new THREE.MeshStandardMaterial(GHOST),
  'Clavicle': () => new THREE.MeshStandardMaterial(GHOST),
};
const RENDER_ORDER = { 'Fracture line': 2, 'Fracture surface': 2, 'Humerus': 3, 'Clavicle': 3 };

export async function loadModel(glbUrl, annotationsUrl) {
  const [gltf, annotations] = await Promise.all([
    new GLTFLoader().loadAsync(glbUrl),
    fetch(annotationsUrl).then(r => {
      if (!r.ok) throw new Error(`${annotationsUrl}: ${r.status}`);
      return r.json();
    }),
  ]);

  const root = gltf.scene;
  // The GLB is in metres (glTF convention) via a root scale; the viewer works in millimetres.
  root.traverse(o => { if (o.name.startsWith('LeftShoulder')) o.scale.setScalar(1); });

  const parts = {};
  root.traverse(o => {
    if (!o.isMesh) return;
    const name = o.name.replace(/_/g, ' ');   // three.js turns spaces in node names into underscores
    parts[name] = o;
    if (MATERIALS[name]) o.material = MATERIALS[name]();
    if (RENDER_ORDER[name]) o.renderOrder = RENDER_ORDER[name];
  });
  parts['Fracture surface'].visible = false;

  return { root, parts, annotations };
}

export function setSeeThrough(parts, on) {
  const m = parts['Scapula'].material;
  m.transparent = on;
  m.opacity = on ? 0.3 : 1;
  m.depthWrite = !on;
  m.needsUpdate = true;
  parts['Fracture surface'].visible = on;
}
