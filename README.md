# Game Scanner Pro v2 — Alpha 1, Part 6

Part 6 adds the first real computer-vision and inference foundations.

## Included

- Everything from the camera and worker milestones
- IndexedDB settings and scan-history stores
- OpenCV.js loader abstraction
- Image preprocessing utilities
- Blur and brightness scoring
- ONNX Runtime Web model loader
- Embedding engine interface
- Mock embedding fallback when no model is installed
- Recognition worker integration
- Runtime model status and performance metrics
- GitHub Pages deployment

## Run

```bash
npm run install:web
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Installing a real ONNX model

Place a browser-compatible model at:

```text
apps/web/public/models/game-embedding.onnx
```

The expected default input is a float tensor shaped:

```text
[1, 3, 224, 224]
```

The model should produce a single embedding output. If the model is absent or fails to load,
the app continues using a deterministic mock embedding so that the pipeline remains testable.

## OpenCV

The OpenCV loader expects a local browser build at:

```text
apps/web/public/vendor/opencv.js
```

Part 6 keeps OpenCV optional. Native canvas preprocessing remains active when OpenCV is absent.
This avoids blocking development while the exact OpenCV build is selected.
