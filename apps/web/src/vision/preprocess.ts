export interface PreprocessResult {
  readonly tensor: Float32Array;
  readonly brightness: number;
  readonly contrast: number;
  readonly blurScore: number;
}

export function preprocessImageData(
  imageData: ImageData,
  inputSize: number
): PreprocessResult {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;
  let edgeSum = 0;

  const luminance = new Float32Array(pixelCount);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const y = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    luminance[p] = y;
    luminanceSum += y;
    luminanceSquaredSum += y * y;
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const laplacian =
        4 * luminance[i] -
        luminance[i - 1] -
        luminance[i + 1] -
        luminance[i - width] -
        luminance[i + width];
      edgeSum += laplacian * laplacian;
    }
  }

  const brightness = luminanceSum / pixelCount;
  const variance = Math.max(0, luminanceSquaredSum / pixelCount - brightness * brightness);
  const contrast = Math.sqrt(variance);
  const blurScore = edgeSum / Math.max(1, (width - 2) * (height - 2));

  const tensor = new Float32Array(3 * inputSize * inputSize);
  const planeSize = inputSize * inputSize;

  for (let y = 0; y < inputSize; y += 1) {
    for (let x = 0; x < inputSize; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x / inputSize) * width));
      const sourceY = Math.min(height - 1, Math.floor((y / inputSize) * height));
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = y * inputSize + x;

      tensor[targetIndex] = data[sourceIndex] / 127.5 - 1;
      tensor[planeSize + targetIndex] = data[sourceIndex + 1] / 127.5 - 1;
      tensor[2 * planeSize + targetIndex] = data[sourceIndex + 2] / 127.5 - 1;
    }
  }

  return {
    tensor,
    brightness: Number(brightness.toFixed(4)),
    contrast: Number(contrast.toFixed(4)),
    blurScore: Number(blurScore.toFixed(6))
  };
}
