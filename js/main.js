// Entry point: wires the scene, model, views, labels and on-page controls together.
import { createScene } from './scene.js';
import { loadModel, setSeeThrough } from './model.js';
import { createViews } from './views.js';
import { createLabels } from './labels.js';
import { createFilms, setFilmOpacity } from './films.js';
import { createExtension } from './extension.js';

const status = document.getElementById('status');
const { renderer, scene, camera, controls } = createScene(document.getElementById('c'));

try {
  const { root, parts, annotations } = await loadModel('model/shoulder.glb', 'model/annotations.json');
  scene.add(root);

  const views = createViews(camera, controls, annotations);
  const labels = createLabels(camera, parts, annotations);

  // controls
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => views.go(b.dataset.view)));
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    el.addEventListener('change', () => fn(el.checked));
    return el;
  };
  const seeThrough = bind('see-through', on => setSeeThrough(parts, on));
  bind('show-humerus', on => { parts['Humerus'].visible = on; });
  bind('show-clavicle', on => { parts['Clavicle'].visible = on; });
  bind('show-labels', on => labels.setEnabled(on));

  // possible unseen extent of the crack (illustrative), with its legend
  const extension = createExtension(parts['Scapula'], annotations);
  const extLegend = document.getElementById('ext-legend');
  const showExtension = on => { extension.visible = on; extLegend.hidden = !on; };
  const extBox = bind('show-extension', showExtension);

  // X-ray films: turning one on also swings the camera round to that film's angle
  const opacitySlider = document.getElementById('film-opacity');
  const films = createFilms(annotations.films, Number(opacitySlider.value));
  opacitySlider.addEventListener('input', () => setFilmOpacity(films, Number(opacitySlider.value)));
  Object.values(films).forEach(m => scene.add(m));
  const FILM_VIEW = { ap: 'xray', axial: 'axial' };
  const filmBoxes = [...document.querySelectorAll('[data-film]')];
  filmBoxes.forEach(box => bind(box.id, on => {
    films[box.dataset.film].visible = on;
    if (on) views.go(FILM_VIEW[box.dataset.film]);
  }));

  // optional start state from the URL, e.g. #crack, #crack+see, #xray+film-ap
  const [view, ...extras] = location.hash.slice(1).split('+');
  views.go(views.has(view) ? view : 'xray', false);
  if (extras.includes('see')) { seeThrough.checked = true; setSeeThrough(parts, true); }
  if (extras.includes('ext')) { extBox.checked = true; showExtension(true); }
  for (const box of filmBoxes) {
    if (extras.includes('film-' + box.dataset.film)) { box.checked = true; films[box.dataset.film].visible = true; }
  }

  status.remove();
  renderer.setAnimationLoop(now => {
    views.update(now);
    controls.update();
    renderer.render(scene, camera);
    labels.update();
  });
} catch (err) {
  console.error(err);
  status.textContent = 'Could not load the 3D model: ' + err.message;
}
