/// <reference lib="webworker" />
import { preprocessImageData } from "../vision/preprocess";
import type { VisionInboundMessage, VisionOutboundMessage } from "./protocol";

const ctx = self as DedicatedWorkerGlobalScope;

ctx.postMessage({
  type: "ready",
  worker: "vision",
  timestamp: performance.now(),
  mode: "canvas"
} satisfies VisionOutboundMessage);

ctx.onmessage = (event: MessageEvent<VisionInboundMessage>) => {
  const message = event.data;
  if (message.type !== "vision:frame") return;

  const startedAt = performance.now();

  try {
    const canvas = new OffscreenCanvas(message.inputSize, message.inputSize);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Unable to create worker canvas.");

    const originalWidth = message.bitmap.width;
    const originalHeight = message.bitmap.height;
    context.drawImage(message.bitmap, 0, 0, message.inputSize, message.inputSize);
    message.bitmap.close();

    const imageData = context.getImageData(0, 0, message.inputSize, message.inputSize);
    const result = preprocessImageData(imageData, message.inputSize);
    const completedAt = performance.now();

    ctx.postMessage(
      {
        type: "vision:result",
        requestId: message.requestId,
        capturedAt: message.capturedAt,
        completedAt,
        width: originalWidth,
        height: originalHeight,
        brightness: result.brightness,
        contrast: result.contrast,
        blurScore: result.blurScore,
        processingMs: Number((completedAt - startedAt).toFixed(2)),
        tensor: result.tensor,
        inputSize: message.inputSize
      } satisfies VisionOutboundMessage,
      [result.tensor.buffer]
    );
  } catch (error) {
    ctx.postMessage({
      type: "error",
      worker: "vision",
      requestId: message.requestId,
      message: error instanceof Error ? error.message : "Vision worker failed."
    } satisfies VisionOutboundMessage);
  }
};
