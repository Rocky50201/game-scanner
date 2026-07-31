# Alpha 1 Part 6

## Pipeline

1. Camera captures a frame.
2. The frame is transferred to the vision worker as an `ImageBitmap`.
3. The worker downsamples the frame.
4. Brightness, contrast, and blur estimates are calculated.
5. A normalized RGB tensor is generated.
6. The recognition worker runs ONNX inference when a model is available.
7. A deterministic mock embedding is used as a fallback.
8. Metrics are sent to the React UI.
9. Scan history is persisted to IndexedDB.

## Model contract

Default input:

- Name: first model input
- Shape: `[1, 3, 224, 224]`
- Type: `float32`
- Channel order: RGB
- Range: normalized to approximately `[-1, 1]`

Default output:

- First model output
- Flattened into a normalized embedding vector

## Next milestone

- Object detection
- Perspective correction
- Real catalog embeddings
- Approximate nearest-neighbor search
