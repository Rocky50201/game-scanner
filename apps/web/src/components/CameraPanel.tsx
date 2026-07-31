import type { RefObject } from "react";
import type { CameraSnapshot } from "../camera/types";

interface Props {
  readonly videoRef: RefObject<HTMLVideoElement>;
  readonly snapshot: CameraSnapshot;
  readonly paused: boolean;
  readonly onStart: () => Promise<void>;
  readonly onStop: () => void;
  readonly onTogglePause: () => Promise<void>;
  readonly onSwitchCamera: () => Promise<void>;
  readonly onSelectDevice: (deviceId: string) => Promise<void>;
}

export function CameraPanel(props: Props) {
  const { videoRef, snapshot, paused } = props;

  return (
    <section className="camera-card">
      <div className="camera-stage">
        <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
        <div className="scan-frame" />

        {!snapshot.active && (
          <div className="camera-empty">
            <span className="camera-icon">◉</span>
            <h2>Camera ready</h2>
            <p>Start the camera to run preprocessing and embedding inference.</p>
            <button className="button button--primary" onClick={props.onStart}>
              Start camera
            </button>
          </div>
        )}

        {snapshot.active && (
          <div className="camera-overlay">
            <span className="live-dot" />
            <span>{paused ? "Paused" : "Live"}</span>
            <span className="camera-resolution">
              {snapshot.width} × {snapshot.height}
            </span>
          </div>
        )}
      </div>

      {snapshot.error && <p className="error-banner">{snapshot.error}</p>}

      <div className="camera-controls">
        <button className="button" disabled={!snapshot.active} onClick={props.onTogglePause}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button className="button" disabled={!snapshot.active} onClick={props.onSwitchCamera}>
          Switch camera
        </button>
        <button className="button button--danger" disabled={!snapshot.active} onClick={props.onStop}>
          Stop
        </button>
      </div>

      {snapshot.devices.length > 1 && (
        <label className="device-picker">
          <span>Camera device</span>
          <select
            value={snapshot.activeDeviceId ?? ""}
            onChange={(event) => props.onSelectDevice(event.target.value)}
          >
            {snapshot.devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}
