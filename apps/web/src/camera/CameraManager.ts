import type { CameraDevice, CameraFacingMode, CameraSnapshot } from "./types";
import { initialCameraSnapshot } from "./types";

type Listener = (snapshot: CameraSnapshot) => void;

export class CameraManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private listeners = new Set<Listener>();
  private snapshot = initialCameraSnapshot;
  private raf: number | null = null;
  private frameWindowStartedAt = 0;
  private framesInWindow = 0;
  private previousFrameAt = 0;
  private paused = false;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  attachVideo(video: HTMLVideoElement): void {
    this.video = video;
    if (this.stream) {
      video.srcObject = this.stream;
      void video.play();
    }
  }

  detachVideo(): void {
    if (this.video) this.video.srcObject = null;
    this.video = null;
  }

  async start(options?: { facingMode?: CameraFacingMode; deviceId?: string }): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.patch({ permission: "unsupported", error: "Camera access is unsupported." });
      return;
    }

    this.stopTracks();
    this.paused = false;
    this.patch({ error: null });

    const facingMode = options?.facingMode ?? this.snapshot.facingMode;

    try {
      this.patch({ permission: "prompt" });
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: options?.deviceId
          ? {
              deviceId: { exact: options.deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30, max: 60 }
            }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30, max: 60 }
            }
      });

      this.patch({ permission: "granted", facingMode });

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      await this.refreshDevices();
      this.updateTrackSettings();
      this.startFrameLoop();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start the camera.";
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");

      this.patch({
        active: false,
        permission: denied ? "denied" : this.snapshot.permission,
        error: message
      });
    }
  }

  async switchFacingMode(): Promise<void> {
    await this.start({
      facingMode: this.snapshot.facingMode === "environment" ? "user" : "environment"
    });
  }

  async selectDevice(deviceId: string): Promise<void> {
    if (deviceId) await this.start({ deviceId });
  }

  pause(): void {
    this.paused = true;
    this.video?.pause();
    this.patch({ fps: 0, frameTimeMs: 0 });
  }

  async resume(): Promise<void> {
    this.paused = false;
    await this.video?.play();
    this.startFrameLoop();
  }

  stop(): void {
    this.stopTracks();
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.video) this.video.srcObject = null;
    this.patch({
      active: false,
      width: 0,
      height: 0,
      fps: 0,
      frameTimeMs: 0,
      activeDeviceId: null
    });
  }

  private async refreshDevices(): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras: CameraDevice[] = devices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`
      }));
    this.patch({ devices: cameras });
  }

  private startFrameLoop(): void {
    if (!this.video || this.paused) return;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.frameWindowStartedAt = performance.now();
    this.previousFrameAt = 0;
    this.framesInWindow = 0;

    const tick = (now: number) => {
      if (!this.video || !this.stream || this.paused) return;
      const frameTimeMs = this.previousFrameAt ? now - this.previousFrameAt : 0;
      this.previousFrameAt = now;
      this.framesInWindow += 1;
      const elapsed = now - this.frameWindowStartedAt;

      if (elapsed >= 500) {
        this.patch({
          active: true,
          fps: Math.round((this.framesInWindow * 1000) / elapsed),
          frameTimeMs: Number(frameTimeMs.toFixed(1))
        });
        this.framesInWindow = 0;
        this.frameWindowStartedAt = now;
      }

      this.raf = requestAnimationFrame(tick);
    };

    this.raf = requestAnimationFrame(tick);
  }

  private updateTrackSettings(): void {
    const track = this.stream?.getVideoTracks()[0];
    const settings = track?.getSettings();
    this.patch({
      active: Boolean(track),
      width: settings?.width ?? 0,
      height: settings?.height ?? 0,
      activeDeviceId: settings?.deviceId ?? null
    });
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private patch(patch: Partial<CameraSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
