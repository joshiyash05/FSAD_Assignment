import type { InputHTMLAttributes, ReactNode } from "react";

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <article className={`p-card ${className}`}>
      {title ? <header className="p-card-title">{title}</header> : null}
      <div className="p-card-content">{children}</div>
    </article>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outlined" | "text" | "danger" | "secondary";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`p-button ${variant} ${className}`}>
      {children}
    </button>
  );
}

export function Tag({ value, severity = "info" }: { value: ReactNode; severity?: "success" | "danger" | "info" | "secondary" }) {
  return <span className={`p-tag ${severity}`}>{value}</span>;
}

export function Message({ severity, children }: { severity: "success" | "error" | "info" | "warn"; children: ReactNode }) {
  return <div className={`p-message ${severity}`}>{children}</div>;
}

export function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, id, ...rest } = props;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...rest} />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

export function Skeleton({ height }: { height: string }) {
  return <div className="skeleton" style={{ height }} />;
}

export function Stat({ label, value, tone = "" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <Card>
      <span className="muted-label">{label}</span>
      <strong className={`stat ${tone}`}>{value}</strong>
    </Card>
  );
}
