export interface PipelineSnapshot {
  readonly running: boolean;
  readonly visionReady: boolean;
  readonly recognitionReady: boolean;
  readonly framesSubmitted: number;
  readonly framesDropped: number;
  readonly lastVisionMs: number;
  readonly lastInferenceMs: number;
  readonly endToEndMs: number;
  readonly brightness: number | null;
  readonly contrast: number | null;
  readonly blurScore: number | null;
  readonly candidate: string;
  readonly confidence: number;
  readonly embeddingDimensions: number;
  readonly modelMode: "loading" | "onnx" | "mock";
  readonly error: string | null;
}

export const initialPipelineSnapshot: PipelineSnapshot = {
  running: false,
  visionReady: false,
  recognitionReady: false,
  framesSubmitted: 0,
  framesDropped: 0,
  lastVisionMs: 0,
  lastInferenceMs: 0,
  endToEndMs: 0,
  brightness: null,
  contrast: null,
  blurScore: null,
  candidate: "Waiting for frames",
  confidence: 0,
  embeddingDimensions: 0,
  modelMode: "loading",
  error: null
};
