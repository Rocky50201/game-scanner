export type WorkerName = "vision" | "recognition" | "database";

export interface WorkerReadyMessage {
  readonly type: "ready";
  readonly worker: WorkerName;
  readonly timestamp: number;
  readonly mode?: string;
}

export interface WorkerErrorMessage {
  readonly type: "error";
  readonly worker: WorkerName;
  readonly message: string;
  readonly requestId?: string;
}

export interface VisionFrameMessage {
  readonly type: "vision:frame";
  readonly requestId: string;
  readonly bitmap: ImageBitmap;
  readonly capturedAt: number;
  readonly inputSize: number;
}

export interface VisionResultMessage {
  readonly type: "vision:result";
  readonly requestId: string;
  readonly capturedAt: number;
  readonly completedAt: number;
  readonly width: number;
  readonly height: number;
  readonly brightness: number;
  readonly contrast: number;
  readonly blurScore: number;
  readonly processingMs: number;
  readonly tensor: Float32Array;
  readonly inputSize: number;
}

export interface RecognitionInitializeMessage {
  readonly type: "recognition:initialize";
  readonly modelUrl: string;
}

export interface RecognitionRequestMessage {
  readonly type: "recognition:request";
  readonly requestId: string;
  readonly capturedAt: number;
  readonly tensor: Float32Array;
  readonly inputSize: number;
  readonly brightness: number;
  readonly contrast: number;
  readonly blurScore: number;
}

export interface RecognitionResultMessage {
  readonly type: "recognition:result";
  readonly requestId: string;
  readonly capturedAt: number;
  readonly completedAt: number;
  readonly processingMs: number;
  readonly candidate: string;
  readonly confidence: number;
  readonly embeddingDimensions: number;
  readonly modelMode: "onnx" | "mock";
  readonly brightness: number;
  readonly contrast: number;
  readonly blurScore: number;
}

export type VisionInboundMessage = VisionFrameMessage;
export type VisionOutboundMessage = WorkerReadyMessage | WorkerErrorMessage | VisionResultMessage;
export type RecognitionInboundMessage = RecognitionInitializeMessage | RecognitionRequestMessage;
export type RecognitionOutboundMessage =
  | WorkerReadyMessage
  | WorkerErrorMessage
  | RecognitionResultMessage;
