// Entry point: wires the scene, model, views, labels and on-page controls together.
import { createScene } from './scene.js';
import { loadModel, setSeeThrough } from './model.js';
import { createViews } from './views.js';
import { createLabels } from './labels.js';

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

  // optional start state from the URL, e.g. #crack or #crack+see
  const [view, extra] = location.hash.slice(1).split('+');
  views.go(views.has(view) ? view : 'xray', false);
  if (extra === 'see') { seeThrough.checked = true; setSeeThrough(parts, true); }

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
