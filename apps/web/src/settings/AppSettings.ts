export interface AppSettings {
  readonly autoScan: boolean;
  readonly sampleIntervalMs: number;
  readonly inputSize: number;
  readonly preferWebGpu: boolean;
}

export const defaultAppSettings: AppSettings = {
  autoScan: true,
  sampleIntervalMs: 400,
  inputSize: 224,
  preferWebGpu: true
};
