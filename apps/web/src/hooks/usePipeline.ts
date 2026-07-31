import { useCallback, useEffect, useMemo, useState } from "react";
import { PipelineManager } from "../pipeline/PipelineManager";
import { initialPipelineSnapshot } from "../pipeline/types";

export function usePipeline(inputSize = 224) {
  const manager = useMemo(() => new PipelineManager(), []);
  const [snapshot, setSnapshot] = useState(initialPipelineSnapshot);

  useEffect(() => {
    const unsubscribe = manager.subscribe(setSnapshot);
    const modelPath = import.meta.env.VITE_MODEL_PATH ?? "models/game-embedding.onnx";
    const modelUrl = new URL(modelPath, document.baseURI).toString();
    manager.start(modelUrl, inputSize);

    return () => {
      unsubscribe();
      manager.stop();
    };
  }, [inputSize, manager]);

  return {
    snapshot,
    submitFrame: useCallback(
      async (video: HTMLVideoElement) => manager.submitFrame(video),
      [manager]
    )
  };
}
