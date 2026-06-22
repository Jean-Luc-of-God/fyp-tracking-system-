import React from 'react';
import { STATES } from '../utils/fypData';

/* ---------------- Icon Component ---------------- */
interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, stroke = 1.8, style, className }) => {
  const P: { [key: string]: string } = {
    dashboard: "M3 13h7V3H3v10zm0 8h7v-6H3v6zm11 0h7V11h-7v10zm0-18v6h7V3h-7z",
    pipeline: "M4 5h16M4 12h10M4 19h7",
    users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    calendar: "M8 2v3M16 2v3M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5z",
    mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 6.5l8.5 6 8.5-6",
    file: "M14 3v5h5M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5z",
    check: "M5 12.5l4.5 4.5L19 7.5",
    checkCircle: "M9 12l2 2 4-4M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    x: "M6 6l12 12M18 6L6 18",
    xCircle: "M15 9l-6 6M9 9l6 6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    chevronRight: "M9 6l6 6-6 6",
    chevronDown: "M6 9l6 6 6-6",
    chevronLeft: "M15 6l-6 6 6 6",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
    filter: "M3 5h18l-7 8v5l-4 2v-7L3 5z",
    bell: "M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9zM10.5 20a2 2 0 0 0 3 0",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
    settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.3-1-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.6 7.6 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5z",
    upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
    download: "M12 4v12M7 11l5 5 5-5M5 20h14",
    whatsapp: "M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zM8.5 8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6.3.5.8 1.2 1.6 1.7.7.4.9.4 1.1.2l.6-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .5-.2 1.3-1 1.6-.7.3-1.7.4-3.3-.4-2-1-3.3-3-3.6-3.5-.2-.4-1-1.4-1-2.6 0-1.2.6-1.8.9-2z",
    alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    arrowRight: "M5 12h14M13 6l6 6-6 6",
    book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H20v14H5.5A1.5 1.5 0 0 0 4 19.5V5.5zM20 18v2H5.5A1.5 1.5 0 0 1 4 18.5",
    scale: "M12 3v18M7 21h10M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zm14 0-2.5 6a3 3 0 0 0 5 0L19 7zM8 5l4-1 4 1",
    key: "M15 7a3 3 0 1 1-2.8 4H9v2H7v2H4v-3l5.2-5.2A3 3 0 0 1 15 7z",
    activity: "M3 12h4l3 8 4-16 3 8h4",
    plus: "M12 5v14M5 12h14",
    logout: "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9",
    flag: "M5 21V4M5 4h11l-1.5 3.5L16 11H5",
    refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5",
    external: "M14 4h6v6M20 4l-9 9M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 4v4h4M12 8v4l3 2",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    link: "M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
    layers: "M12 3 2 8.5 12 14l10-5.5L12 3zM2 15.5 12 21l10-5.5",
    dot: "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
    edit: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
    building: "M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  };
  
  const d = P[name] || P.dot;
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {d.split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={"M" + seg} />
      ))}
    </svg>
  );
};

/* ---------------- Avatar Component ---------------- */
interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  role: 'Student' | 'Supervisor' | 'Facilitator' | 'Examiner' | 'HOD' | 'Superadmin' | 'System' | string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 30, color, role }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const palette: { [key: string]: string } = { 
    Student: "#2A6FB5", 
    Supervisor: "#1F3A5F", 
    Facilitator: "#C98A12", 
    Examiner: "#6B4FA8", 
    HOD: "#1E8E5A", 
    Superadmin: "#C0392B", 
    System: "#6B7E96" 
  };
  const bg = color || palette[role] || "#2D4E78";
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, background: bg }}>
      {initials}
    </span>
  );
};

/* ---------------- Badge Component ---------------- */
interface BadgeProps {
  tone?: 'grey' | 'navy' | 'blue' | 'green' | 'amber' | 'violet' | string;
  children: React.ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ tone = "grey", children, dot, style }) => {
  return (
    <span className={`badge badge-${tone}`} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
};

/* ---------------- StateBadge Component ---------------- */
interface StateBadgeProps {
  stateIndex: number;
  short?: boolean;
  style?: React.CSSProperties;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ stateIndex, short, style }) => {
  const s = STATES[stateIndex];
  if (!s) return null;
  const map: { [key: string]: string } = { 
    navy: "navy", 
    blue: "blue", 
    green: "green", 
    amber: "amber", 
    violet: "violet" 
  };
  return (
    <Badge tone={map[s.color] || "grey"} dot style={style}>
      {short ? s.short : s.label}
      {s.external && " · ext"}
    </Badge>
  );
};

/* ---------------- MetricCard Component ---------------- */
interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  tone: 'amber' | 'red' | 'green' | 'blue' | 'navy' | string;
  icon?: string;
  onClick?: () => void;
  active?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, tone, icon, onClick, active }) => {
  const toneColor = ({ 
    amber: "var(--amber-deep)", 
    red: "var(--red)", 
    green: "var(--green-deep)", 
    blue: "var(--blue)", 
    navy: "var(--navy)" 
  } as { [key: string]: string })[tone] || "var(--navy)";
  
  return (
    <div className="card metric-card" onClick={onClick}
      style={{ 
        padding: "15px 17px", 
        cursor: onClick ? "pointer" : "default", 
        borderColor: active ? toneColor : "var(--line)", 
        boxShadow: active ? "0 0 0 2px " + toneColor + "22" : "var(--sh-sm)" 
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
        {icon && <div style={{ color: toneColor, opacity: .8 }}><Icon name={icon} size={17} /></div>}
      </div>
      <div className="num" style={{ fontSize: 27, fontWeight: 600, color: "var(--ink)", lineHeight: 1, letterSpacing: "-.02em" }}>
        {value}
      </div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

/* ---------------- SectionTitle Component ---------------- */
interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
  badge?: string | number;
  style?: React.CSSProperties;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, sub, right, badge, style }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12, ...style }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
          {children}
          {badge !== undefined && badge !== "" && (
            <span className="badge" style={{ padding: "0 6px", height: 18, background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 10.5, fontWeight: 600 }}>
              {badge}
            </span>
          )}
        </h2>
        {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-3)" }}>{sub}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
};

/* ---------------- Skeleton Loader Component ---------------- */
export const Skeleton: React.FC<{ style?: React.CSSProperties; width?: string | number; height?: string | number }> = ({ style, width, height }) => {
  return <div className="shimmer" style={{ background: "var(--surface-2)", borderRadius: 6, width: width || "100%", height: height || 20, ...style }} />;
};

/* ---------------- EmptyState Component ---------------- */
interface EmptyStateProps {
  icon?: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
  tone?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = "search", title, sub, action, tone = "navy" }) => {
  const c = ({
    amber: "var(--amber-deep)",
    red: "var(--red)",
    green: "var(--green-deep)",
    blue: "var(--blue)",
    navy: "var(--navy)",
    violet: "var(--violet)"
  } as { [key: string]: string })[tone] || "var(--ink-3)";
  
  return (
    <div style={{ padding: "40px 24px", textAlign: "center", maxWidth: 360, margin: "0 auto" }}>
      <div style={{ 
        width: 56, 
        height: 56, 
        borderRadius: 14, 
        background: c + "12", 
        color: c, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        margin: "0 auto 14px" 
      }}>
        <Icon name={icon} size={26} />
      </div>
      <h4 style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", margin: "0 0 5px" }}>{title}</h4>
      <p className="muted" style={{ fontSize: 12.5, margin: "0 0 16px", lineHeight: 1.5 }}>{sub}</p>
      {action}
    </div>
  );
};

/* ---------------- WhatsAppButton Component ---------------- */
export const WhatsAppButton: React.FC<{ link: string; team?: string; sm?: boolean }> = ({ link, team, sm }) => {
  return (
    <a href={link} target="_blank" rel="noreferrer" className={`btn btn-solid-green ${sm ? 'btn-sm' : ''}`} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <Icon name="whatsapp" size={sm ? 14 : 16} />
      {team || "Join WhatsApp Group"}
    </a>
  );
};

/* ---------------- Modal Component ---------------- */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,31,51,.5)", backdropFilter: "blur(2px)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 20px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: "100%", maxWidth: width }}>
        {children}
      </div>
    </div>
  );
};

/* ---------------- StateTracker Component ---------------- */
interface StateTrackerProps {
  stateIndex: number;
  attempts?: { n: number; ts: string; status: 'pending' | 'accepted' | 'rejected'; reason?: string }[];
  protoPres?: number;
  onPick?: (index: number) => void;
  compact?: boolean;
}

export const StateTracker: React.FC<StateTrackerProps> = ({ stateIndex, attempts, protoPres, onPick, compact }) => {
  return (
    <div className="state-rail" style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", padding: compact ? "6px 2px 2px" : "10px 2px 4px", gap: 0 }}>
      {STATES.map((s, i) => {
        const done = i < stateIndex;
        const cur = i === stateIndex;
        const future = i > stateIndex;
        const reworkN = s.key === "prop_review" ? (attempts || []).filter(a => a.status === "rejected").length
          : s.key === "proto_review" ? Math.max(0, (protoPres || 1) - 1) : 0;
        const fill = cur ? "var(--amber)" : done ? (s.color === "green" ? "var(--green)" : "var(--navy)") : "var(--white)";
        const ring = cur ? "var(--amber)" : done ? "var(--navy)" : "var(--line)";
        const ink = cur ? "var(--navy-900)" : done ? "#fff" : "var(--ink-4)";
        return (
          <div key={s.key} onClick={() => onPick && onPick(i)} title={s.label}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: compact ? 74 : 88, position: "relative", cursor: onPick ? "pointer" : "default", flex: "1 0 auto" }}>
            {i < STATES.length - 1 && <div style={{ position: "absolute", top: compact ? 12 : 14, left: "50%", width: "100%", height: 2, background: i < stateIndex ? "var(--navy)" : "var(--line)" }} />}
            <div style={{ width: compact ? 24 : 28, height: compact ? 24 : 28, borderRadius: "50%", background: fill, border: "2px solid " + ring, display: "flex", alignItems: "center", justifyContent: "center", color: ink, zIndex: 1, fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, boxShadow: cur ? "0 0 0 4px var(--amber-bg)" : "none" }}>
              {done ? <Icon name="check" size={compact ? 13 : 15} stroke={2.4} /> : (i + 1)}
            </div>
            <div style={{ marginTop: 7, textAlign: "center", fontSize: compact ? 10 : 10.5, fontWeight: cur ? 600 : 500, color: cur ? "var(--ink)" : future ? "var(--ink-4)" : "var(--ink-2)", lineHeight: 1.25, maxWidth: compact ? 70 : 82 }}>
              {s.short}
              {s.external && <div style={{ fontSize: 8.5, color: "var(--violet)", fontWeight: 600, letterSpacing: ".04em" }}>EXTERNAL</div>}
            </div>
            {reworkN > 0 && <div className="badge badge-red" style={{ height: 16, padding: "0 6px", fontSize: 9.5, marginTop: 4 }}>×{reworkN} rework</div>}
          </div>
        );
      })}
    </div>
  );
};


