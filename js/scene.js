// Renderer, camera, lights and controls. Knows nothing about the model's content.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x16181c);

  const camera = new THREE.PerspectiveCamera(35, 1, 1, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);   // follows the camera
  key.position.set(-150, 200, 200);
  camera.add(key);
  scene.add(camera);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(300, -100, -200);
  scene.add(rim);

  // On narrow (portrait) screens, widen the vertical field of view so the horizontal view stays as wide as
  // on a 0.8-aspect window. Widening the lens instead of moving the camera keeps the X-ray films lined up.
  const BASE_FOV = 35, MIN_ASPECT = 0.8;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    const halfV = THREE.MathUtils.degToRad(BASE_FOV / 2);
    camera.fov = camera.aspect >= MIN_ASPECT ? BASE_FOV
      : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfV) * MIN_ASPECT / camera.aspect));
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, controls };
}
