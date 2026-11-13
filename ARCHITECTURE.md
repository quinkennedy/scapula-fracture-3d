# Architecture

A static site with no build step. three.js is loaded from the jsDelivr CDN through an import map in `index.html`; everything else is plain ES modules loaded from this repository.

| Path | What it is |
|---|---|
| `index.html` | Page markup and the on-page controls |
| `css/viewer.css` | Styles |
| `js/main.js` | Entry point: wires the pieces together and handles the controls |
| `js/scene.js` | Renderer, camera, lights, orbit controls |
| `js/model.js` | Loads the model and annotations; sets each part's look |
| `js/views.js` | Preset camera views and the orbiting transition between them |
| `js/labels.js` | Labels pinned to the model, including the fracture label and its leader line |
| `js/films.js` | X-ray films shown as semi-transparent image panels in front of the bone |
| `js/extension.js` | "Possible unseen extent": a tinted layer on the bone along the routes in `possibleExtension`, fading away from the crack's tip |
| `model/shoulder.glb` | 3D geometry: scapula, fracture line, fracture surface, humerus, clavicle |
| `model/annotations.json` | Label positions, fracture reference points, the scapular plane, where each X-ray film sits, and the illustrative routes for the possible unseen extent, in model millimetres |
| `model/xray_ap.jpg`, `model/xray_axial.jpg` | Cropped, contrast-adjusted AP and axial X-ray images (exported without DICOM metadata) |
