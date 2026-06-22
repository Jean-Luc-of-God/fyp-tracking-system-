import React, { useState, useEffect, useRef } from 'react';
import { Icon, Avatar, Badge, StateBadge } from './SharedUI';
import { useAppContext } from '../context/AppContext';
import type { Student } from '../types';

/* ticking clock helper hook */
export function useNow(interval = 1000) {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return t;
}

/* ---------------- Countdown Component ---------------- */
interface CountdownProps {
  to: number;
  size?: 'md' | 'lg';
  onExpire?: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ to, size = "md", onExpire }) => {
  const now = useNow(1000);
  const ms = to - now;
  const firedRef = useRef(false);

  useEffect(() => {
    if (ms <= 0 && !firedRef.current) {
      firedRef.current = true;
      if (onExpire) onExpire();
    }
  }, [ms, onExpire]);

  if (ms <= 0) return <Badge tone="red" dot>Window closed</Badge>;

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const urgent = ms < 12 * 3600 * 1000;
  const big = size === "lg";

  const seg = (val: number, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: big ? 52 : 40 }}>
      <span className="num" style={{ fontSize: big ? 26 : 18, fontWeight: 700, lineHeight: 1, color: urgent ? "var(--red)" : "var(--ink)" }}>
        {String(val).padStart(2, "0")}
      </span>
      <span style={{ fontSize: big ? 10 : 9, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-4)", marginTop: 3 }}>
        {label}
      </span>
    </div>
  );

  const colon = (
    <span className="num" style={{ fontSize: big ? 22 : 15, fontWeight: 600, color: "var(--ink-4)", alignSelf: "flex-start", marginTop: big ? 2 : 1 }}>
      :
    </span>
  );

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: big ? 8 : 5,
      padding: big ? "12px 16px" : "6px 10px",
      background: urgent ? "var(--red-bg)" : "var(--surface)",
      border: "1px solid " + (urgent ? "#E6B7AE" : "var(--line)"),
      borderRadius: 10
    }}>
      {seg(d, "days")}{colon}{seg(h, "hrs")}{colon}{seg(m, "min")}{colon}{seg(ss, "sec")}
    </div>
  );
};

/* ---------------- Rich-text Editor (rejection reasons) ---------------- */
interface RichTextProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const RichText: React.FC<RichTextProps> = ({ value, onChange, placeholder, minHeight = 120 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ bold?: boolean; italic?: boolean; ul?: boolean }>({});

  useEffect(() => {
    if (ref.current && value !== undefined && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, []); // Run once on mount

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val || undefined);
    if (ref.current) {
      ref.current.focus();
    }
    sync();
    refreshActive();
  };

  const sync = () => {
    if (ref.current && onChange) {
      onChange(ref.current.innerHTML);
    }
  };

  const refreshActive = () => {
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        ul: document.queryCommandState("insertUnorderedList")
      });
    } catch (e) {
      // ignore
    }
  };

  const Tb = ({ cmd, val, label, on }: { cmd: string; val?: string; label: string; on?: boolean }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      style={{
        minWidth: 30,
        height: 28,
        padding: "0 8px",
        border: "1px solid var(--line)",
        borderRadius: 6,
        background: on ? "var(--navy)" : "var(--white)",
        color: on ? "#fff" : "var(--ink-2)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        fontStyle: cmd === "italic" ? "italic" : "normal"
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 9, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--line-soft)", background: "var(--surface)", flexWrap: "wrap" }}>
        <Tb cmd="bold" label="B" on={active.bold} />
        <Tb cmd="italic" label="I" on={active.italic} />
        <Tb cmd="insertUnorderedList" label="• List" on={active.ul} />
        <Tb cmd="formatBlock" val="<h4>" label="H" />
        <div style={{ flex: 1 }} />
        <span className="muted" style={{ fontSize: 11, alignSelf: "center" }}>Rich text — the student sees this formatting</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        data-ph={placeholder || "Type the reason…"}
        className="rt-area"
        style={{ minHeight, padding: "12px 14px", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6, outline: "none" }}
      />
    </div>
  );
};

/* ---------------- Word Doc Chip ---------------- */
interface DocChipProps {
  doc: {
    name: string;
    size: string;
    pages?: number;
  };
  action?: string;
  onAction?: () => void;
  tone?: 'blue' | 'navy';
}

export const DocChip: React.FC<DocChipProps> = ({ doc, action = "Download", onAction, tone = "blue" }) => {
  const mapColors = {
    blue: ["var(--blue-bg)", "var(--blue)"],
    navy: ["#E2EAF3", "var(--navy)"]
  };
  const t = mapColors[tone] || mapColors.blue;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, background: "#fff" }}>
      <span style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: t[0],
        color: t[1],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 700
      }}>
        DOC
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {doc.name}
        </div>
        <div className="mono muted" style={{ fontSize: 11 }}>
          Word document · {doc.size}{doc.pages ? " · " + doc.pages + " pages" : ""}
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onAction}>
        <Icon name="download" size={14} /> {action}
      </button>
    </div>
  );
};

/* ---------------- Student ID Search ---------------- */
interface StudentIdSearchProps {
  onOpen?: (student: Student) => void;
  placeholder?: string;
  width?: string | number;
}

export const StudentIdSearch: React.FC<StudentIdSearchProps> = ({ onOpen, placeholder = "Search by student ID…", width = 280 }) => {
  const { students } = useAppContext();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const results = q.trim()
    ? students.filter(s =>
        s.id.toLowerCase().includes(q.toLowerCase()) ||
        s.name.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div ref={ref} style={{ position: "relative", width }}>
      <Icon name="search" size={16} style={{ position: "absolute", left: 11, top: 11, color: "var(--ink-4)" }} />
      <input
        className="input mono"
        value={q}
        placeholder={placeholder}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={{ paddingLeft: 34, height: 38, fontSize: 12.5 }}
      />
      {open && q.trim() && (
        <div className="card fade-in" style={{ position: "absolute", top: 44, left: 0, right: 0, padding: 6, boxShadow: "var(--sh-pop)", zIndex: 60, maxHeight: 320, overflowY: "auto" }}>
          {results.length ? results.map(s => (
            <button
              key={s.id}
              onMouseDown={() => { if (onOpen) onOpen(s); setOpen(false); setQ(s.id); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: 0, borderRadius: 8, background: "transparent", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Avatar name={s.name} role="Student" size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                <div className="mono muted" style={{ fontSize: 10.5 }}>{s.id} · {s.org}</div>
              </div>
              <StateBadge stateIndex={s.stateIndex} short />
            </button>
          )) : (
            <div className="muted" style={{ fontSize: 12.5, padding: "10px 12px" }}>
              No student matches “{q}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------- Letter Status Badge ---------------- */
interface LetterStatusBadgeProps {
  status: string;
  expired?: boolean;
}

export const LetterStatusBadge: React.FC<LetterStatusBadgeProps> = ({ status, expired }) => {
  if (status === "approved") return <Badge tone="green" dot>Approved</Badge>;
  if (status === "rejected") return <Badge tone="red" dot>Rejected — resubmit</Badge>;
  if (status === "submitted") return <Badge tone="blue" dot>Submitted · in review</Badge>;
  if (status === "requested") return expired ? <Badge tone="grey" dot>Window closed</Badge> : <Badge tone="amber" dot>Letter requested</Badge>;
  return <Badge tone="grey">Not requested</Badge>;
};

/* ---------------- Toast Notification Engine ---------------- */
export interface Toast {
  id: number;
  msg: string;
  tone: 'success' | 'info' | 'error' | 'warn';
  undo?: () => void;
  exiting: boolean;
  _timer?: ReturnType<typeof setTimeout>;
}

const toastListeners = new Set<() => void>();
let toasts: Toast[] = [];

export function notify(msg: string, opts?: 'success' | 'info' | 'error' | 'warn' | { tone?: 'success' | 'info' | 'error' | 'warn'; undo?: () => void; duration?: number }) {
  const o = typeof opts === "string" ? { tone: opts } : (opts || {});
  const tone = o.tone || "success";
  const t: Toast = {
    id: Date.now() + Math.random(),
    msg,
    tone,
    undo: o.undo,
    exiting: false
  };
  toasts = [...toasts, t];
  toastListeners.forEach(f => f());
  const dur = o.duration || (o.undo ? 5200 : 3400);
  t._timer = setTimeout(() => dismissToast(t.id), dur);
  return t.id;
}

export function dismissToast(id: number) {
  const t = toasts.find(x => x.id === id);
  if (!t) return;
  t.exiting = true;
  toastListeners.forEach(f => f());
  setTimeout(() => {
    toasts = toasts.filter(x => x.id !== id);
    toastListeners.forEach(f => f());
  }, 200);
}

export const ToastHost: React.FC = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    toastListeners.add(fn);
    return () => { toastListeners.delete(fn); };
  }, []);

  const cfg = {
    success: ["var(--green)", "check"],
    info: ["var(--blue)", "bell"],
    error: ["var(--red)", "alert"],
    warn: ["var(--amber-deep)", "alert"]
  } as { [key: string]: [string, string] };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 600, display: "flex", flexDirection: "column", gap: 10 }} role="status" aria-live="polite">
      {toasts.map(t => {
        const [c, ic] = cfg[t.tone] || cfg.success;
        return (
          <div key={t.id} className={"toast" + (t.exiting ? " exit" : "")}>
            <span className="ic" style={{ background: c }}><Icon name={ic} size={13} stroke={2.4} /></span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            {t.undo && <button className="undo" onClick={() => { if (t._timer) clearTimeout(t._timer); t.undo!(); dismissToast(t.id); }}>Undo</button>}
          </div>
        );
      })}
    </div>
  );
};
