declare global {
  interface Window {
    cv?: {
      readonly Mat: unknown;
      readonly onRuntimeInitialized?: () => void;
    };
  }
}

export type OpenCvState = "idle" | "loading" | "ready" | "unavailable" | "error";

export class OpenCvLoader {
  private state: OpenCvState = "idle";

  getState(): OpenCvState {
    return this.state;
  }

  async load(scriptPath = "vendor/opencv.js"): Promise<OpenCvState> {
    if (window.cv?.Mat) {
      this.state = "ready";
      return this.state;
    }

    this.state = "loading";

    try {
      const response = await fetch(scriptPath, { method: "HEAD" });
      if (!response.ok) {
        this.state = "unavailable";
        return this.state;
      }

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = scriptPath;
        script.async = true;
        script.onload = () => {
          if (window.cv?.Mat) resolve();
          else reject(new Error("OpenCV loaded without exposing cv.Mat."));
        };
        script.onerror = () => reject(new Error("OpenCV script failed to load."));
        document.head.appendChild(script);
      });

      this.state = "ready";
    } catch {
      this.state = "unavailable";
    }

    return this.state;
  }
}
