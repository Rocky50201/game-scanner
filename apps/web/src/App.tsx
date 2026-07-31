import { useEffect, useMemo, useState } from "react";
import { CameraPanel } from "./components/CameraPanel";
import { PipelinePanel } from "./components/PipelinePanel";
import { StatusCard } from "./components/StatusCard";
import { useCamera } from "./hooks/useCamera";
import { usePipeline } from "./hooks/usePipeline";
import type { SubsystemStatus } from "./types/status";

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const camera = useCamera();
  const pipeline = usePipeline(224);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  useEffect(() => {
    if (!camera.snapshot.active || camera.paused) return;

    const timer = window.setInterval(() => {
      const video = camera.videoRef.current;
      if (video) void pipeline.submitFrame(video);
    }, 400);

    return () => window.clearInterval(timer);
  }, [camera.paused, camera.snapshot.active, camera.videoRef, pipeline]);

  const statuses = useMemo<SubsystemStatus[]>(
    () => [
      {
        label: "Camera",
        state: camera.snapshot.error ? "error" : camera.snapshot.active ? "ready" : "waiting",
        detail: camera.snapshot.active
          ? `${camera.snapshot.width}×${camera.snapshot.height} at ${camera.snapshot.fps} FPS`
          : "Waiting for permission"
      },
      {
        label: "Vision worker",
        state: pipeline.snapshot.visionReady ? "ready" : "loading",
        detail: pipeline.snapshot.visionReady ? "Preprocessing frames" : "Starting"
      },
      {
        label: "ONNX runtime",
        state: pipeline.snapshot.recognitionReady ? "ready" : "loading",
        detail:
          pipeline.snapshot.modelMode === "onnx"
            ? "Real model loaded"
            : pipeline.snapshot.modelMode === "mock"
              ? "Mock embedding fallback"
              : "Loading model"
      },
      {
        label: "IndexedDB",
        state: "ready",
        detail: "Settings and scan history enabled"
      },
      {
        label: "Network",
        state: isOnline ? "ready" : "offline",
        detail: isOnline ? "Connected" : "Offline mode"
      }
    ],
    [camera.snapshot, isOnline, pipeline.snapshot]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Game Scanner Pro v2</p>
          <h1>Alpha 1</h1>
        </div>
        <span className="build-badge">Part 6</span>
      </header>

      <main className="content">
        <CameraPanel
          videoRef={camera.videoRef}
          snapshot={camera.snapshot}
          paused={camera.paused}
          onStart={camera.start}
          onStop={camera.stop}
          onTogglePause={camera.togglePause}
          onSwitchCamera={camera.switchCamera}
          onSelectDevice={camera.selectDevice}
        />

        <PipelinePanel snapshot={pipeline.snapshot} />

        <section className="status-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Runtime</p>
              <h2>System status</h2>
            </div>
            <span className="version">0.1.0-alpha.1</span>
          </div>
          <div className="status-grid">
            {statuses.map((status) => (
              <StatusCard key={status.label} status={status} />
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Installable PWA</span>
        <span>Vision + ONNX foundation</span>
      </footer>
    </div>
  );
}
