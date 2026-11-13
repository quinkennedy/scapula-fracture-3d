# Scapula fracture 3D viewer

An interactive 3D view of a left shoulder blade (scapula) showing a nondisplaced, oblique fracture of the inferior scapular neck.

The crack's position, angle and length were measured from a plain AP shoulder X-ray. Plain X-rays can't show how deep a crack goes, so the model draws it through the full thickness of the bone. The upper arm bone and collarbone are simplified stand-ins. This is an illustration, not a diagnosis.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page markup and the on-page controls |
| `css/viewer.css` | Styles |
| `js/main.js` | Entry point: wires the pieces together and handles the controls |
| `js/scene.js` | Renderer, camera, lights, orbit controls |
| `js/model.js` | Loads the model and annotations; sets each part's look |
| `js/views.js` | Preset camera views and the orbiting transition between them |
| `js/labels.js` | Labels pinned to the model, including the fracture label and its leader line |
| `model/shoulder.glb` | 3D geometry: scapula, fracture line, fracture surface, humerus, clavicle |
| `model/annotations.json` | Label positions, fracture reference points and the scapular plane, in model millimetres |

three.js is loaded from the jsDelivr CDN, so there is no build step.

## Viewing

**GitHub Pages:** Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

**Locally:** the page loads its scripts and model as separate files, so it has to be served over HTTP. Opening `index.html` straight from disk won't work. From this folder, run:

```
python -c "import http.server as h, mimetypes; mimetypes.add_type('text/javascript', '.js'); h.test(h.SimpleHTTPRequestHandler, port=8000)"
```

Then open http://localhost:8000/. The `mimetypes` line matters on Windows: plain `python -m http.server` can serve `.js` files as `text/plain`, and browsers refuse to run them.

You can choose the starting view with a URL hash: `#xray`, `#front`, `#back`, `#side` or `#crack`. Add `+see` to start in see-through mode, e.g. `#crack+see`.

## Credits and license

- **Scapula mesh:** [BodyParts3D](https://lifesciencedb.jp/bp3d/), © The Database Center for Life Science, licensed under [CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). It was mirrored to a left scapula and re-oriented, and the fracture markings and simplified bones were added.
- **The 3D model and annotations in `model/`:** shared under the same license, [CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en).
- **3D rendering:** [three.js](https://threejs.org/) (MIT license).
