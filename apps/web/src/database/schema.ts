import type { DBSchema } from "idb";
import type { AppSettings } from "../settings/AppSettings";

export interface ScanHistoryRecord {
  readonly id: string;
  readonly capturedAt: number;
  readonly candidate: string;
  readonly confidence: number;
  readonly brightness: number;
  readonly blurScore: number;
  readonly modelMode: "onnx" | "mock";
}

export interface GameScannerSchema extends DBSchema {
  settings: {
    key: "app";
    value: AppSettings;
  };
  scanHistory: {
    key: string;
    value: ScanHistoryRecord;
    indexes: { "by-captured-at": number };
  };
}
