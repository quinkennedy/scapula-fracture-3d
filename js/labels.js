// HTML labels pinned to points on the model. The fracture label is placed beside the crack
// (perpendicular to it on screen, away from the bone) with a leader line, so it never covers the red line.
import * as THREE from 'three';

// Labels that should hide when their part is hidden.
const LABEL_PART = { 'Upper arm bone': 'Humerus', 'Collarbone': 'Clavicle' };

export function createLabels(camera, parts, annotations, container = document.body) {
  const tmp = new THREE.Vector3();
  const toScreen = v => {
    tmp.copy(v).project(camera);
    return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight, tmp.z];
  };

  const labels = Object.entries(annotations.labels).map(([name, p]) => {
    const el = document.createElement('div');
    el.className = 'lbl' + (name === 'Fracture' ? ' frac' : '');
    el.textContent = name;
    container.appendChild(el);
    return { name, el, pos: new THREE.Vector3(...p) };
  });

  container.insertAdjacentHTML('beforeend', '<svg id="leader"><line/></svg>');
  const leader = container.querySelector('#leader line');

  const f = annotations.fracture;
  const crackA = new THREE.Vector3(...f.surfacePointA), crackB = new THREE.Vector3(...f.surfacePointB);
  const crackM = crackA.clone().add(crackB).multiplyScalar(0.5);
  const boneCentre = new THREE.Vector3();

  let enabled = true;

  function placeFracture(L) {
    const [ax, ay, az] = toScreen(crackA), [bx, by] = toScreen(crackB);
    const [mx, my] = toScreen(crackM), [cx, cy] = toScreen(boneCentre);
    const vis = enabled && az < 1;
    L.el.style.display = leader.style.display = vis ? '' : 'none';
    if (!vis) return;

    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let px, py;
    if (len < 8) { px = mx - cx; py = my - cy; }   // crack seen end-on: push away from the bone
    else {
      px = -dy / len; py = dx / len;
      if (px * (mx - cx) + py * (my - cy) < 0) { px = -px; py = -py; }
    }
    const pl = Math.hypot(px, py) || 1; px /= pl; py /= pl;

    // Try spots along the perpendicular (away from the bone first, then further out, then the other side)
    // and take the first that doesn't overlap another label. On small screens the default spot can land on one.
    const W = L.el.offsetWidth, H = L.el.offsetHeight;
    const base = 34 + len / 2 + Math.abs(px) * W / 2 + Math.abs(py) * H / 2;
    const others = labels.filter(o => o !== L && o.el.style.display !== 'none').map(o => o.el.getBoundingClientRect());
    const hits = (x, y) => others.some(r => x - W / 2 - 4 < r.right && x + W / 2 + 4 > r.left && y - H / 2 - 4 < r.bottom && y + H / 2 + 4 > r.top);
    let lx, ly;
    for (const [sgn, k] of [[1, 1], [1, 1.6], [-1, 1], [1, 2.2], [-1, 1.6]]) {
      const qx = px * sgn, qy = py * sgn;
      lx = mx + qx * base * k; ly = my + qy * base * k;
      if (!hits(lx, ly)) { px = qx; py = qy; break; }
      if (sgn === -1 && k === 1.6) { lx = mx + px * base; ly = my + py * base; }   // nothing free: use the default
    }
    L.el.style.left = lx + 'px';
    L.el.style.top = ly + 'px';

    // leader: from the label's edge to just short of the crack
    const w = L.el.offsetWidth / 2 + 3, h = L.el.offsetHeight / 2 + 3;
    const s = Math.min(w / Math.max(Math.abs(px), 1e-6), h / Math.max(Math.abs(py), 1e-6));
    leader.setAttribute('x1', lx - px * s); leader.setAttribute('y1', ly - py * s);
    leader.setAttribute('x2', mx + px * 5); leader.setAttribute('y2', my + py * 5);
  }

  function update() {
    let fracture = null;
    for (const L of labels) {
      if (L.name === 'Fracture') { fracture = L; continue; }   // placed last, around the others
      const part = parts[LABEL_PART[L.name]];
      const [x, y, z] = toScreen(L.pos);
      const vis = enabled && z < 1 && !(part && !part.visible);
      L.el.style.display = vis ? '' : 'none';
      if (vis) { L.el.style.left = x + 'px'; L.el.style.top = y + 'px'; }
    }
    if (fracture) placeFracture(fracture);
  }

  return { update, setEnabled: on => { enabled = on; } };
}
