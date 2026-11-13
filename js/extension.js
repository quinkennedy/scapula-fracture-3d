// "Possible unseen extent": a soft tinted layer on the bone showing where the crack could continue
// without showing on a plain X-ray. Illustrative, not measured: the routes come from annotations.json
// (possibleExtension), each starting at the visible crack's inner tip and fading with distance.
import * as THREE from 'three';

const SAMPLES_PER_MM = 1;
// low -> high weight: pale yellow -> amber -> orange (kept clear of the crack's red)
const RAMP = [[0, new THREE.Color(0xffe680)], [0.5, new THREE.Color(0xffb020)], [1, new THREE.Color(0xff7a00)]];
const MAX_ALPHA = 0.85;

function rampColor(w, out) {
  for (let i = 1; i < RAMP.length; i++) {
    if (w <= RAMP[i][0]) {
      const [w0, c0] = RAMP[i - 1], [w1, c1] = RAMP[i];
      return out.copy(c0).lerp(c1, (w - w0) / (w1 - w0));
    }
  }
  return out.copy(RAMP[RAMP.length - 1][1]);
}

// Sample a path as a smooth curve, with strength and radius interpolated along its length.
function samplePath(path) {
  const curve = new THREE.CatmullRomCurve3(path.points.map(p => new THREE.Vector3(...p)));
  const count = Math.max(8, Math.ceil(curve.getLength() * SAMPLES_PER_MM));
  return curve.getSpacedPoints(count).map((p, i) => {
    const k = i / count;
    return {
      p,
      strength: THREE.MathUtils.lerp(path.strength[0], path.strength[1], k),
      radius: THREE.MathUtils.lerp(path.radius[0], path.radius[1], k),
    };
  });
}

// Weight 0..1 for each vertex: the strongest nearby path sample, measured within the scapular plane
// (so a band covers the bone's full thickness), skipping bone well in front of or behind the path.
function vertexWeights(positions, ext, planeNormal) {
  const samples = ext.paths.flatMap(samplePath);
  const gate = ext.depthGate;
  const n = planeNormal, v = new THREE.Vector3(), d = new THREE.Vector3();
  const w = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    let best = 0;
    for (const s of samples) {
      if (s.strength <= best) continue;
      d.subVectors(v, s.p);
      const depth = d.dot(n);
      if (Math.abs(depth) > gate) continue;
      const inPlane = Math.sqrt(Math.max(0, d.lengthSq() - depth * depth));
      if (inPlane >= s.radius) continue;
      const f = 1 - THREE.MathUtils.smoothstep(inPlane, 0, s.radius);
      best = Math.max(best, s.strength * f);
    }
    w[i] = best;
  }
  return w;
}

// Builds the layer as a child of the scapula mesh, sharing its vertices. Hidden by default.
export function createExtension(scapula, annotations) {
  const ext = annotations.possibleExtension;
  const src = scapula.geometry;
  const pos = src.attributes.position;
  const w = vertexWeights(pos, ext, new THREE.Vector3(...annotations.scapularPlaneNormal).normalize());

  const colors = new Float32Array(pos.count * 4), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    rampColor(w[i], c);
    colors.set([c.r, c.g, c.b, w[i] * MAX_ALPHA], i * 4);
  }

  // only the triangles that are tinted at all
  const index = src.index.array, tris = [];
  for (let t = 0; t < index.length; t += 3) {
    if (w[index[t]] > 0.01 || w[index[t + 1]] > 0.01 || w[index[t + 2]] > 0.01) tris.push(index[t], index[t + 1], index[t + 2]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', pos);
  geo.setAttribute('normal', src.attributes.normal);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 4));
  geo.setIndex(tris);

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, transparent: true, depthWrite: false, roughness: 0.7, metalness: 0,
    emissive: 0x3a2000, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  }));
  mesh.name = 'Possible extension';
  mesh.renderOrder = 1;
  mesh.visible = false;
  scapula.add(mesh);
  return mesh;
}
