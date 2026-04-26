import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info" | "accent" | "neutral";

export function PanelCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={`panel-card ${className}`.trim()}>{children}</article>;
}

export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <PanelCard className={`metric-card ${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <small className="metric-detail">{detail}</small>
    </PanelCard>
  );
}

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: Tone;
}) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
