export type CameraFacingMode = "user" | "environment";

export interface CameraDevice {
  readonly deviceId: string;
  readonly label: string;
}

export interface CameraSnapshot {
  readonly active: boolean;
  readonly permission: PermissionState | "unsupported" | "unknown";
  readonly facingMode: CameraFacingMode;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly devices: readonly CameraDevice[];
  readonly activeDeviceId: string | null;
  readonly error: string | null;
}

export const initialCameraSnapshot: CameraSnapshot = {
  active: false,
  permission: "unknown",
  facingMode: "environment",
  width: 0,
  height: 0,
  fps: 0,
  frameTimeMs: 0,
  devices: [],
  activeDeviceId: null,
  error: null
};
