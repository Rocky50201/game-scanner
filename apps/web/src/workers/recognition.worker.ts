/// <reference lib="webworker" />
import { EmbeddingEngine } from "../recognition/EmbeddingEngine";
import type {
  RecognitionInboundMessage,
  RecognitionOutboundMessage
} from "./protocol";

const ctx = self as DedicatedWorkerGlobalScope;
const engine = new EmbeddingEngine();
let mode: "onnx" | "mock" = "mock";

ctx.postMessage({
  type: "ready",
  worker: "recognition",
  timestamp: performance.now(),
  mode
} satisfies RecognitionOutboundMessage);

ctx.onmessage = async (event: MessageEvent<RecognitionInboundMessage>) => {
  const message = event.data;

  if (message.type === "recognition:initialize") {
    mode = await engine.initialize(message.modelUrl);
    ctx.postMessage({
      type: "ready",
      worker: "recognition",
      timestamp: performance.now(),
      mode
    } satisfies RecognitionOutboundMessage);
    return;
  }

  try {
    const result = await engine.embed(
      message.tensor,
      message.inputSize,
      message.requestId
    );

    const quality =
      Math.min(1, message.contrast * 4) *
      Math.min(1, Math.max(0, message.blurScore * 35));
    const exposurePenalty =
      message.brightness < 0.12 || message.brightness > 0.92 ? 0.45 : 1;
    const confidence = Math.max(0.05, Math.min(0.92, quality * exposurePenalty));

    let candidate = "Game cover candidate";
    if (message.brightness < 0.12) candidate = "Scene too dark";
    else if (message.brightness > 0.92) candidate = "Possible glare";
    else if (message.blurScore < 0.0015) candidate = "Image may be blurred";

    ctx.postMessage({
      type: "recognition:result",
      requestId: message.requestId,
      capturedAt: message.capturedAt,
      completedAt: performance.now(),
      processingMs: result.inferenceMs,
      candidate,
      confidence: Number(confidence.toFixed(2)),
      embeddingDimensions: result.embedding.length,
      modelMode: result.mode,
      brightness: message.brightness,
      contrast: message.contrast,
      blurScore: message.blurScore
    } satisfies RecognitionOutboundMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      worker: "recognition",
      requestId: message.requestId,
      message: error instanceof Error ? error.message : "Recognition worker failed."
    } satisfies RecognitionOutboundMessage);
  }
};
