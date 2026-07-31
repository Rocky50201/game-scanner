import { addScan } from "../database/ScanHistoryRepository";
import type {
  RecognitionOutboundMessage,
  VisionOutboundMessage
} from "../workers/protocol";
import type { PipelineSnapshot } from "./types";
import { initialPipelineSnapshot } from "./types";

type Listener = (snapshot: PipelineSnapshot) => void;

export class PipelineManager {
  private visionWorker: Worker | null = null;
  private recognitionWorker: Worker | null = null;
  private listeners = new Set<Listener>();
  private snapshot = initialPipelineSnapshot;
  private inFlightRequestId: string | null = null;
  private sequence = 0;
  private inputSize = 224;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  start(modelUrl: string, inputSize = 224): void {
    if (this.snapshot.running) return;
    this.inputSize = inputSize;

    this.visionWorker = new Worker(new URL("../workers/vision.worker.ts", import.meta.url), {
      type: "module",
      name: "vision-worker"
    });
    this.recognitionWorker = new Worker(
      new URL("../workers/recognition.worker.ts", import.meta.url),
      { type: "module", name: "recognition-worker" }
    );

    this.visionWorker.onmessage = (event: MessageEvent<VisionOutboundMessage>) =>
      this.handleVisionMessage(event.data);
    this.recognitionWorker.onmessage = (event: MessageEvent<RecognitionOutboundMessage>) =>
      this.handleRecognitionMessage(event.data);

    const onError = (event: ErrorEvent) => {
      this.inFlightRequestId = null;
      this.patch({ error: event.message || "A worker failed." });
    };

    this.visionWorker.onerror = onError;
    this.recognitionWorker.onerror = onError;
    this.patch({ running: true, modelMode: "loading", error: null });

    this.recognitionWorker.postMessage({
      type: "recognition:initialize",
      modelUrl
    });
  }

  stop(): void {
    this.visionWorker?.terminate();
    this.recognitionWorker?.terminate();
    this.visionWorker = null;
    this.recognitionWorker = null;
    this.inFlightRequestId = null;
    this.patch({ ...initialPipelineSnapshot, running: false });
  }

  async submitFrame(video: HTMLVideoElement): Promise<void> {
    if (!this.visionWorker || !this.snapshot.visionReady || video.readyState < 2) return;

    if (this.inFlightRequestId) {
      this.patch({ framesDropped: this.snapshot.framesDropped + 1 });
      return;
    }

    const requestId = `${Date.now()}-${this.sequence++}`;
    this.inFlightRequestId = requestId;

    try {
      const bitmap = await createImageBitmap(video);
      this.patch({ framesSubmitted: this.snapshot.framesSubmitted + 1 });
      this.visionWorker.postMessage(
        {
          type: "vision:frame",
          requestId,
          bitmap,
          capturedAt: Date.now(),
          inputSize: this.inputSize
        },
        [bitmap]
      );
    } catch (error) {
      this.inFlightRequestId = null;
      this.patch({
        error: error instanceof Error ? error.message : "Unable to capture frame."
      });
    }
  }

  private handleVisionMessage(message: VisionOutboundMessage): void {
    if (message.type === "ready") {
      this.patch({ visionReady: true });
      return;
    }

    if (message.type === "error") {
      this.inFlightRequestId = null;
      this.patch({ error: message.message });
      return;
    }

    this.patch({
      lastVisionMs: message.processingMs,
      brightness: message.brightness,
      contrast: message.contrast,
      blurScore: message.blurScore
    });

    this.recognitionWorker?.postMessage(
      {
        type: "recognition:request",
        requestId: message.requestId,
        capturedAt: message.capturedAt,
        tensor: message.tensor,
        inputSize: message.inputSize,
        brightness: message.brightness,
        contrast: message.contrast,
        blurScore: message.blurScore
      },
      [message.tensor.buffer]
    );
  }

  private handleRecognitionMessage(message: RecognitionOutboundMessage): void {
    if (message.type === "ready") {
      this.patch({
        recognitionReady: true,
        modelMode: message.mode === "onnx" ? "onnx" : "mock"
      });
      return;
    }

    if (message.type === "error") {
      this.inFlightRequestId = null;
      this.patch({ error: message.message });
      return;
    }

    this.inFlightRequestId = null;
    const endToEndMs = Math.max(0, Date.now() - message.capturedAt);

    this.patch({
      lastInferenceMs: message.processingMs,
      endToEndMs,
      candidate: message.candidate,
      confidence: message.confidence,
      embeddingDimensions: message.embeddingDimensions,
      modelMode: message.modelMode,
      brightness: message.brightness,
      contrast: message.contrast,
      blurScore: message.blurScore
    });

    void addScan({
      id: message.requestId,
      capturedAt: message.capturedAt,
      candidate: message.candidate,
      confidence: message.confidence,
      brightness: message.brightness,
      blurScore: message.blurScore,
      modelMode: message.modelMode
    });
  }

  private patch(patch: Partial<PipelineSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
