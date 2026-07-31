import * as ort from "onnxruntime-web";

export interface EmbeddingResult {
  readonly embedding: Float32Array;
  readonly mode: "onnx" | "mock";
  readonly inferenceMs: number;
}

export class EmbeddingEngine {
  private session: ort.InferenceSession | null = null;
  private loadAttempted = false;

  async initialize(modelUrl: string): Promise<"onnx" | "mock"> {
    if (this.session) return "onnx";
    if (this.loadAttempted) return "mock";

    this.loadAttempted = true;

    try {
      ort.env.wasm.numThreads = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1));
      this.session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all"
      });
      return "onnx";
    } catch {
      this.session = null;
      return "mock";
    }
  }

  async embed(
    tensorData: Float32Array,
    inputSize: number,
    requestId: string
  ): Promise<EmbeddingResult> {
    const startedAt = performance.now();

    if (this.session) {
      const inputName = this.session.inputNames[0];
      const tensor = new ort.Tensor("float32", tensorData, [1, 3, inputSize, inputSize]);
      const outputs = await this.session.run({ [inputName]: tensor });
      const outputName = this.session.outputNames[0];
      const output = outputs[outputName].data as Float32Array;
      return {
        embedding: normalize(new Float32Array(output)),
        mode: "onnx",
        inferenceMs: Number((performance.now() - startedAt).toFixed(2))
      };
    }

    const embedding = mockEmbedding(tensorData, requestId, 128);
    return {
      embedding,
      mode: "mock",
      inferenceMs: Number((performance.now() - startedAt).toFixed(2))
    };
  }
}

function normalize(values: Float32Array): Float32Array {
  let sum = 0;
  for (const value of values) sum += value * value;
  const norm = Math.sqrt(sum) || 1;
  return values.map((value) => value / norm);
}

function mockEmbedding(
  tensorData: Float32Array,
  seedText: string,
  dimensions: number
): Float32Array {
  let seed = 2166136261;
  for (const char of seedText) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  const result = new Float32Array(dimensions);
  const stride = Math.max(1, Math.floor(tensorData.length / dimensions));

  for (let i = 0; i < dimensions; i += 1) {
    let total = 0;
    const start = i * stride;
    const end = Math.min(tensorData.length, start + stride);
    for (let j = start; j < end; j += 1) total += tensorData[j];
    seed = Math.imul(seed ^ i, 1664525) + 1013904223;
    result[i] = total / Math.max(1, end - start) + ((seed >>> 0) / 4294967295 - 0.5) * 0.01;
  }

  return normalize(result);
}
