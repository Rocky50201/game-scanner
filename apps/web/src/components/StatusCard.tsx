import type { SubsystemStatus } from "../types/status";

export function StatusCard({ status }: { readonly status: SubsystemStatus }) {
  return (
    <article className="status-card">
      <div>
        <p className="status-card__label">{status.label}</p>
        <p className="status-card__detail">{status.detail}</p>
      </div>
      <span className={`status-pill status-pill--${status.state}`}>{status.state}</span>
    </article>
  );
}
