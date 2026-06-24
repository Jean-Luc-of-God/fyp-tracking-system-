import React from 'react';
import DOMPurify from 'dompurify';
import { Icon, Avatar, Badge } from './SharedUI';
import { fmt, fmtT, TEMPLATES } from '../utils/fypData';
import type { Meeting } from '../types';

export interface TimelineEvent {
  terminal?: boolean;
  kind?: string;
  focus?: boolean;
  external?: boolean;
  label: string;
  forward?: boolean;
  ts: string;
  actor: {
    name: string;
    role: string;
  };
  note?: string | null;
  reason?: string;
  reasonHtml?: string;
  file?: string;
  meeting?: Meeting;
  email?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  highlightEmails?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ events, highlightEmails }) => {
  function nodeStyle(e: TimelineEvent) {
    if (e.terminal) return { bg: "var(--navy)", ic: "scale", c: "#fff" };
    if (e.kind === "rework") return { bg: "var(--red)", ic: "refresh", c: "#fff" };
    if (e.focus) return { bg: "var(--amber)", ic: "user", c: "var(--navy-900)" };
    if (e.external) return { bg: "var(--violet)", ic: "external", c: "#fff" };
    return { bg: "var(--green)", ic: "check", c: "#fff" };
  }

  return (
    <div className="timeline" style={{ position: "relative" }}>
      {events.map((e, i) => {
        const ns = nodeStyle(e);
        const tmpl = e.email ? TEMPLATES[e.email] : null;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 14, position: "relative", paddingBottom: i === events.length - 1 ? 0 : 18 }}>
            {i < events.length - 1 && <div style={{ position: "absolute", left: 14, top: 30, bottom: 0, width: 2, background: "var(--line)" }} />}
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: ns.bg, color: ns.c, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: "0 0 0 4px var(--white)" }}>
              <Icon name={ns.ic} size={16} stroke={2.1} />
            </div>
            <div style={{ paddingTop: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: e.kind === "rework" ? "var(--red-deep)" : "var(--ink)" }}>
                  {e.label}
                  {e.forward && <span className="badge badge-navy" style={{ marginLeft: 8, height: 16, fontSize: 9.5, padding: "0 6px" }}>FORWARD-ONLY</span>}
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{fmt(e.ts)} · {fmtT(e.ts)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
                <Avatar name={e.actor.name} role={e.actor.role} size={20} />
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}><strong style={{ fontWeight: 600 }}>{e.actor.name}</strong> <span className="muted">· {e.actor.role}</span></span>
              </div>
              {e.note && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{e.note}</div>}
              {e.reason && <div style={{ marginTop: 7, padding: "8px 11px", background: "var(--red-bg)", borderRadius: 7, fontSize: 12, color: "var(--red-deep)", borderLeft: "3px solid var(--red)" }}><strong>Rejection reason:</strong> {e.reason}</div>}
              {e.reasonHtml && <div style={{ marginTop: 7, padding: "9px 12px", background: "var(--red-bg)", borderRadius: 7, fontSize: 12.5, color: "var(--red-deep)", borderLeft: "3px solid var(--red)" }}><strong>Rejection reason</strong><div className="rt-content" style={{ marginTop: 4 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(e.reasonHtml, { ALLOWED_TAGS: ['b', 'i', 'ul', 'ol', 'li', 'br', 'strong', 'em'], ALLOWED_ATTR: [] }) }} /></div>}
              {e.file && <div className="chip" style={{ marginTop: 7, height: 26, cursor: "default" }}><Icon name="file" size={13} /> {e.file}</div>}
              {e.meeting && (
                <div style={{ marginTop: 7, padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span><span className="muted">Attendance:</span> <strong style={{ color: e.meeting.attendance === "Absent" ? "var(--red)" : "var(--green-deep)" }}>{e.meeting.attendance}</strong></span>
                    <span><span className="muted">Topic:</span> {e.meeting.topic}</span>
                  </div>
                  <div className="muted" style={{ marginTop: 4 }}>{e.meeting.notes}</div>
                </div>
              )}
              {tmpl && (
                <div className="email-receipt" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 11px", background: highlightEmails ? "var(--amber-bg)" : "var(--blue-bg)", border: "1px solid " + (highlightEmails ? "var(--amber)" : "#C7DCF1"), borderRadius: 7, cursor: "default" }}>
                  <Icon name="mail" size={14} style={{ color: highlightEmails ? "var(--amber-deep)" : "var(--blue)" }} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-2)" }}><strong>Email sent</strong> · {tmpl.event}</span>
                  <Badge tone="green" style={{ height: 16, fontSize: 9 }}>DELIVERED</Badge>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
