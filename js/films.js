// X-ray films shown as textured quads, placed in front of the bone so they line up with it
// when seen from the matching camera view (see "films" in model/annotations.json).
import * as THREE from 'three';

export function createFilms(filmsMeta, opacity = 0.55) {
  const loader = new THREE.TextureLoader();
  const films = {};
  for (const [name, f] of Object.entries(filmsMeta)) {
    const [tl, tr, br, bl] = f.corners;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...tl, ...tr, ...br, ...bl], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
    geo.setIndex([0, 3, 2, 0, 2, 1]);
    const tex = loader.load(f.image);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: tex, side: THREE.DoubleSide, transparent: true, opacity, depthWrite: false,
    }));
    mesh.name = f.title;
    mesh.visible = false;
    mesh.renderOrder = 10;   // draw after everything else, so the bone shows through the film
    films[name] = mesh;
  }
  return films;
}

export function setFilmOpacity(films, opacity) {
  for (const m of Object.values(films)) m.material.opacity = opacity;
}
