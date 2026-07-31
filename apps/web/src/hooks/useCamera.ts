import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraManager } from "../camera/CameraManager";
import { initialCameraSnapshot } from "../camera/types";

export function useCamera() {
  const manager = useMemo(() => new CameraManager(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [snapshot, setSnapshot] = useState(initialCameraSnapshot);
  const [paused, setPaused] = useState(false);

  useEffect(() => manager.subscribe(setSnapshot), [manager]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    manager.attachVideo(video);
    return () => {
      manager.detachVideo();
      manager.stop();
    };
  }, [manager]);

  return {
    videoRef,
    snapshot,
    paused,
    start: useCallback(async () => {
      await manager.start({ facingMode: "environment" });
      setPaused(false);
    }, [manager]),
    stop: useCallback(() => {
      manager.stop();
      setPaused(false);
    }, [manager]),
    togglePause: useCallback(async () => {
      if (paused) {
        await manager.resume();
        setPaused(false);
      } else {
        manager.pause();
        setPaused(true);
      }
    }, [manager, paused]),
    switchCamera: useCallback(async () => {
      await manager.switchFacingMode();
      setPaused(false);
    }, [manager]),
    selectDevice: useCallback(async (deviceId: string) => {
      await manager.selectDevice(deviceId);
      setPaused(false);
    }, [manager])
  };
}
