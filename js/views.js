// Preset camera views and the orbiting transition between them.
import * as THREE from 'three';

const DURATION_MS = 900;
const ease = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

export function createViews(camera, controls, annotations) {
  const n = new THREE.Vector3(...annotations.scapularPlaneNormal);
  const crack = new THREE.Vector3(...annotations.fracture.midpoint);
  const origin = new THREE.Vector3();

  const presets = {
    xray:  { pos: n.clone().multiplyScalar(430), target: origin },   // face-on to the shoulder blade, like the X-ray
    front: { pos: new THREE.Vector3(0, 0, 430), target: origin },
    back:  { pos: new THREE.Vector3(0, 0, -430), target: origin },
    side:  { pos: new THREE.Vector3(430, 30, 120), target: origin },
    crack: { pos: crack.clone().add(n.clone().multiplyScalar(150)).add(new THREE.Vector3(15, -35, 0)), target: crack },
  };

  let anim = null;

  function go(name, smooth = true) {
    const v = presets[name];
    if (!v) return;
    if (!smooth) {
      camera.position.copy(v.pos);
      controls.target.copy(v.target);
      controls.update();
      anim = null;
      return;
    }
    // Orbit: interpolate angle and distance around the target rather than moving in a straight line.
    const t0 = controls.target.clone();
    const s0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(t0));
    const s1 = new THREE.Spherical().setFromVector3(v.pos.clone().sub(v.target));
    let dTheta = s1.theta - s0.theta;
    dTheta = ((dTheta + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;   // shortest way round
    anim = { t0, t1: v.target.clone(), s0, s1, dTheta, start: performance.now() };
  }

  function update(now) {
    if (!anim) return;
    const k = Math.min(1, (now - anim.start) / DURATION_MS), e = ease(k);
    controls.target.lerpVectors(anim.t0, anim.t1, e);
    const s = new THREE.Spherical(
      anim.s0.radius + (anim.s1.radius - anim.s0.radius) * e,
      anim.s0.phi + (anim.s1.phi - anim.s0.phi) * e,
      anim.s0.theta + anim.dTheta * e);
    camera.position.setFromSpherical(s).add(controls.target);
    if (k >= 1) anim = null;
  }

  return { go, update, has: name => name in presets };
}
