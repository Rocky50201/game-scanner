import type { PipelineSnapshot } from "../pipeline/types";

export function PipelinePanel({ snapshot }: { readonly snapshot: PipelineSnapshot }) {
  return (
    <section className="pipeline-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI pipeline</p>
          <h2>Live analysis</h2>
        </div>
        <span className="version">{snapshot.modelMode.toUpperCase()}</span>
      </div>

      <div className="result-card">
        <p className="result-card__label">Current result</p>
        <strong>{snapshot.candidate}</strong>
        <span>{Math.round(snapshot.confidence * 100)}% confidence</span>
      </div>

      <div className="metrics-grid">
        <div><span>Vision</span><strong>{snapshot.lastVisionMs.toFixed(1)} ms</strong></div>
        <div><span>Inference</span><strong>{snapshot.lastInferenceMs.toFixed(1)} ms</strong></div>
        <div><span>Brightness</span><strong>{snapshot.brightness?.toFixed(3) ?? "—"}</strong></div>
        <div><span>Contrast</span><strong>{snapshot.contrast?.toFixed(3) ?? "—"}</strong></div>
        <div><span>Blur score</span><strong>{snapshot.blurScore?.toFixed(5) ?? "—"}</strong></div>
        <div><span>Embedding</span><strong>{snapshot.embeddingDimensions || "—"} dims</strong></div>
        <div><span>Submitted</span><strong>{snapshot.framesSubmitted}</strong></div>
        <div><span>Dropped</span><strong>{snapshot.framesDropped}</strong></div>
      </div>

      {snapshot.error && <p className="error-banner">{snapshot.error}</p>}
    </section>
  );
}
