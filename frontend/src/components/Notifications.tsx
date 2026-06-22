import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Student, PendingCoordinationItem } from '../types';
import { Icon, Badge, EmptyState, SectionTitle } from './SharedUI';
import { computeRisk } from './Risk';
import { EscalationStore } from './Escalation';
import { fmt, supById } from '../utils/fypData';

// Notification Read-state store
class NotifStoreImpl {
  read: { [id: string]: boolean } = {};
  listeners = new Set<() => void>();

  isRead(id: string) {
    return !!this.read[id];
  }

  markRead(id: string) {
    this.read[id] = true;
    this.emit();
  }

  markAllRead(ids: string[]) {
    ids.forEach(i => { this.read[i] = true; });
    this.emit();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  emit() {
    this.listeners.forEach(f => f());
  }
}

export const NotifStore = new NotifStoreImpl();

export function useNotifs() {
  const [, force] = useState(0);
  useEffect(() => {
    return NotifStore.subscribe(() => force(n => n + 1));
  }, []);
  return NotifStore;
}

export interface AppNotification {
  id: string;
  cat: 'action' | 'update' | 'alert';
  icon: string;
  tone: 'red' | 'amber' | 'blue' | 'green' | 'violet' | 'grey';
  title: string;
  body: string;
  ts: number;
  page: string;
  sid?: string;
}

/* build the notification list for a given role */
export function buildNotifs(
  role: string,
  students: Student[],
  letters: any,
  activeUserId: string,
  pendingItems: PendingCoordinationItem[],
  notifLogs: any[]
): AppNotification[] {
  const out: AppNotification[] = [];
  const push = (o: AppNotification) => out.push(o);

  if (role === "student") {
    const stuId = activeUserId || "STU-2026-041";
    const stu = students.find(s => s.id === stuId);
    if (stu) {
      const L = letters[stu.id] || { status: 'none' };
      if (L.status === "requested" || L.status === "rejected") {
        push({
          id: "n-stu-letter",
          cat: "action",
          icon: "send",
          tone: "amber",
          title: L.status === "rejected" ? "Your case letter was returned — revise & resend" : "Case-study letter requested",
          body: L.status === "rejected" ? "The HOD returned your letter with a reason. Your window has reopened." : "Submit before your window closes.",
          ts: (L.requestedTs || Date.now()),
          page: "case"
        });
      }
      if (L.status === "approved") {
        push({
          id: "n-stu-appr",
          cat: "update",
          icon: "checkCircle",
          tone: "green",
          title: "Case letter approved",
          body: "You've advanced to the Prototyping phase. Requirements are attached.",
          ts: (L.approvedTs || Date.now()),
          page: "dashboard"
        });
      }
      if (stu.supervisorId) {
        const sup = supById[stu.supervisorId] || { name: stu.supervisorId };
        push({
          id: "n-stu-sup",
          cat: "update",
          icon: "users",
          tone: "blue",
          title: "Supervisor: " + sup.name,
          body: "Office hours and group sessions are on your supervisor page.",
          ts: Date.now() - 6 * 86400000,
          page: "supervisor"
        });
      }
      const r = computeRisk(stu, letters);
      if (r.level === "critical" || r.level === "watch") {
        push({
          id: "n-stu-risk",
          cat: "alert",
          icon: "alert",
          tone: r.level === "critical" ? "red" : "amber",
          title: r.daysLeft < 0 ? "Your book deadline has passed" : "Deadline approaching — " + r.daysLeft + " days left",
          body: "Act now to stay on track and protect your fees.",
          ts: Date.now() - 86400000,
          page: "dashboard"
        });
      }
      push({
        id: "n-stu-meet",
        cat: "update",
        icon: "calendar",
        tone: "blue",
        title: "Upcoming supervision meeting",
        body: "Check your supervisor's confirmed time.",
        ts: Date.now() - 2 * 86400000,
        page: "supervisor"
      });
    }
  }

  if (role === "supervisor" || role === "hod") {
    const supId = activeUserId || (role === "hod" ? "hod-biz" : "sup-hab");
    const mine = students.filter(s => s.supervisorId === supId);
    mine.forEach(s => {
      if (s.nextMeeting && !s.nextMeeting.confirmed) {
        push({
          id: "n-mtg-" + s.id,
          cat: "action",
          icon: "calendar",
          tone: "amber",
          title: "Confirm a meeting time",
          body: s.name + " is waiting for you to confirm.",
          ts: Date.now() - 86400000,
          page: role === "hod" ? "mysupervision" : "supervision",
          sid: s.id
        });
      }
      if (s.stateIndex === 7) {
        push({
          id: "n-signoff-" + s.id,
          cat: "action",
          icon: "checkCircle",
          tone: "blue",
          title: "Book ready to sign off",
          body: s.name + " can be advanced to pre-defense.",
          ts: Date.now() - 2 * 86400000,
          page: role === "hod" ? "mysupervision" : "supervision",
          sid: s.id
        });
      }
      if (s.flagged) {
        push({
          id: "n-flag-" + s.id,
          cat: "alert",
          icon: "flag",
          tone: "red",
          title: "Complaint on file",
          body: s.name + " — review the timeline.",
          ts: Date.now() - 3 * 86400000,
          page: role === "hod" ? "mysupervision" : "supervision",
          sid: s.id
        });
      }
    });
  }

  if (role === "supervisor") {
    const supId = activeUserId || "sup-hab";
    // Examinees are students where supervisor is predefense/defense examiner
    const ex = students.filter(s => 
      (s.examinerPreId === supId || s.examinerDefId === supId) && 
      s.stateIndex === 9 && 
      s.predefenseStatus !== "Cleared to defend"
    );
    ex.forEach(s => {
      push({
        id: "n-pre-" + s.id,
        cat: "action",
        icon: "scale",
        tone: "violet",
        title: "Pre-defense to conduct",
        body: s.name + " is awaiting your pre-defense.",
        ts: Date.now() - 86400000,
        page: "examining",
        sid: s.id
      });
    });
  }

  if (role === "hod") {
    // Letters queue
    const queue = Object.entries(letters)
      .map(([id, state]: [string, any]) => ({ id, ...state, student: students.find(s => s.id === id) }))
      .filter(l => l.status === "submitted" && l.student);

    queue.forEach((q: any) => {
      push({
        id: "n-rev-" + q.id,
        cat: "action",
        icon: "checkCircle",
        tone: "blue",
        title: "Letter awaiting review",
        body: q.student.name + " submitted their case letter.",
        ts: (q.submittedTs || Date.now()),
        page: "review"
      });
    });

    // top risk + escalations
    const crit = students
      .filter(s => s.stateIndex < 10)
      .map(s => ({ s, r: computeRisk(s, letters) }))
      .filter(x => x.r.level === "critical")
      .slice(0, 4);

    crit.forEach(({ s, r }) => {
      push({
        id: "n-risk-" + s.id,
        cat: "alert",
        icon: "alert",
        tone: "red",
        title: "Critical risk: " + s.name,
        body: (r.daysLeft < 0 ? "Deadline lapsed" : r.daysLeft + " days left") + " · " + r.action,
        ts: Date.now() - 86400000,
        page: "risk",
        sid: s.id
      });
    });

    const dueCount = students
      .filter(s => s.stateIndex < 10)
      .filter(s => {
        const r = computeRisk(s, letters);
        return EscalationStore.dueRung(s.id, r.daysLeft) > 0;
      }).length;

    if (dueCount) {
      push({
        id: "n-esc",
        cat: "action",
        icon: "activity",
        tone: "amber",
        title: dueCount + " escalation reminders due",
        body: "Deadline reminders are ready to send up the chain.",
        ts: Date.now() - 3600000,
        page: "escalation"
      });
    }
  }

  if (role === "facilitator") {
    (pendingItems || []).forEach(p => {
      push({
        id: "n-pend-" + p.id,
        cat: p.sev === "high" ? "alert" : "action",
        icon: p.kind === "email" ? "mail" : p.kind === "stalled" ? "clock" : "scale",
        tone: p.sev === "high" ? "red" : p.sev === "med" ? "amber" : "grey",
        title: p.label,
        body: p.student + " · " + p.detail,
        ts: Date.now() - (p.id.length * 8e6),
        page: "pending"
      });
    });

    const crit = students
      .filter(s => s.stateIndex < 10)
      .map(s => ({ s, r: computeRisk(s, letters) }))
      .filter(x => x.r.level === "critical")
      .slice(0, 3);

    crit.forEach(({ s, r }) => {
      push({
        id: "n-frisk-" + s.id,
        cat: "alert",
        icon: "alert",
        tone: "red",
        title: "Critical risk: " + s.name,
        body: (r.daysLeft < 0 ? "Deadline lapsed" : r.daysLeft + "d left") + " · " + r.action,
        ts: Date.now() - 2 * 86400000,
        page: "risk",
        sid: s.id
      });
    });
  }

  if (role === "examiner") {
    // Pre-defense/defense examiner matches activeUserId
    const supId = activeUserId || "sup-hab";
    const ex = students.filter(s => s.examinerPreId === supId || s.examinerDefId === supId);
    ex.forEach(s => {
      push({
        id: "n-ex-" + s.id,
        cat: "action",
        icon: "scale",
        tone: "violet",
        title: "Assigned to examine " + s.name,
        body: s.id + " · " + (s.predefenseStatus || "pre-defense"),
        ts: Date.now() - 86400000,
        page: "predefense"
      });
    });
  }

  if (role === "superadmin") {
    const failed = (notifLogs || []).filter(n => n.status === "failed");
    failed.forEach(n => {
      push({
        id: "n-sa-" + n.id,
        cat: "alert",
        icon: "alert",
        tone: "red",
        title: "Email delivery failed",
        body: n.toName + " · " + (n.error || "retried"),
        ts: (n.ts ? new Date(n.ts).getTime() : Date.now()),
        page: "notifications"
      });
    });
    push({
      id: "n-sa-api",
      cat: "update",
      icon: "external",
      tone: "amber",
      title: "Prototype-review API not connected",
      body: "Running on a stub — connect in Configuration.",
      ts: Date.now() - 5 * 86400000,
      page: "config"
    });
    push({
      id: "n-sa-health",
      cat: "update",
      icon: "shield",
      tone: "green",
      title: "All core services operational",
      body: "SMTP, database and retention job healthy.",
      ts: Date.now() - 3600000,
      page: "dashboard"
    });
  }

  return out.sort((a, b) => b.ts - a.ts);
}

const NOTIF_TONE = { 
  red: "var(--red)", 
  amber: "var(--amber-deep)", 
  blue: "var(--blue)", 
  green: "var(--green-deep)", 
  violet: "var(--violet)", 
  grey: "var(--ink-3)" 
};

const NOTIF_BG = { 
  red: "var(--red-bg)", 
  amber: "var(--amber-bg)", 
  blue: "var(--blue-bg)", 
  green: "var(--green-bg)", 
  violet: "var(--violet-bg)", 
  grey: "var(--surface-2)" 
};

function relTime(ts: number): string {
  const d = (Date.now() - ts) / 1000;
  if (d < 3600) return Math.max(1, Math.floor(d / 60)) + "m ago";
  if (d < 86400) return Math.floor(d / 3600) + "h ago";
  if (d < 7 * 86400) return Math.floor(d / 86400) + "d ago";
  return fmt(new Date(ts).toISOString());
}

/* one notification row */
interface NotifRowProps {
  n: AppNotification;
  read: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const NotifRow: React.FC<NotifRowProps> = ({ n, read, onClick, compact }) => {
  return (
    <button onClick={onClick} style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: compact ? "11px 14px" : "13px 18px", border: 0, borderTop: "1px solid var(--line-soft)", background: read ? "transparent" : "var(--surface)", cursor: "pointer", position: "relative" }}>
      {!read && <span style={{ position: "absolute", left: 5, top: "50%", marginTop: -3, width: 6, height: 6, borderRadius: "50%", background: NOTIF_TONE[n.tone] }} />}
      <span style={{ width: 32, height: 32, borderRadius: 8, background: NOTIF_BG[n.tone], color: NOTIF_TONE[n.tone], display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginLeft: 4 }}><Icon name={n.icon} size={16} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: read ? 500 : 600, color: "var(--ink)", lineHeight: 1.35 }}>{n.title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</span>
        <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-4)", marginTop: 4, fontFamily: "var(--mono)" }}>{relTime(n.ts)}</span>
      </span>
      <Icon name="chevronRight" size={15} style={{ color: "var(--ink-4)", flex: "none", alignSelf: "center" }} />
    </button>
  );
};

/* bell dropdown */
interface NotifBellProps {
  role: string;
  onGoto?: (page: string, sid?: string) => void;
}

export const NotifBell: React.FC<NotifBellProps> = ({ role, onGoto }) => {
  const { students, letters, activeUserId, pendingItems, notificationLogs } = useAppContext();
  const ns = useNotifs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifs = useMemo(() => {
    return buildNotifs(role, students, letters, activeUserId, pendingItems, notificationLogs);
  }, [role, students, letters, activeUserId, pendingItems, notificationLogs]);

  const unread = notifs.filter(n => !ns.isRead(n.id));

  useEffect(() => {
    const h = (e: MouseEvent) => { 
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); 
      }
    };
    document.addEventListener("mousedown", h); 
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { 
    setOpen(false); 
  }, [role]);

  function go(n: AppNotification) { 
    ns.markRead(n.id); 
    setOpen(false); 
    if (onGoto) onGoto(n.page, n.sid); 
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <button onClick={() => setOpen(o => !o)} style={{ position: "relative", display: "flex", alignItems: "center", color: "var(--ink-3)", background: "transparent", border: 0, cursor: "pointer", padding: 4 }} aria-label="Notifications">
        <Icon name="bell" size={19} />
        {unread.length > 0 && (
          <span style={{ 
            position: "absolute", 
            top: -1, 
            right: -1, 
            minWidth: 16, 
            height: 16, 
            padding: "0 4px", 
            borderRadius: 8, 
            background: "var(--red)", 
            color: "#fff", 
            fontSize: 10, 
            fontWeight: 700, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            border: "1.5px solid #fff", 
            fontFamily: "var(--mono)" 
          }}>
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="card fade-in" style={{ position: "absolute", right: 0, top: 38, width: 360, maxWidth: "90vw", padding: 0, boxShadow: "var(--sh-pop)", zIndex: 60, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)" } as React.CSSProperties}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              Notifications {unread.length > 0 && <span className="badge badge-red" style={{ marginLeft: 6, height: 18 }}>{unread.length} new</span>}
            </div>
            {unread.length > 0 && (
              <button className="btn btn-quiet btn-sm" onClick={() => ns.markAllRead(notifs.map(n => n.id))}>
                Mark all read
              </button>
            )}
          </div>
          <div className="scroll-y" style={{ maxHeight: 380 }}>
            {notifs.length ? notifs.slice(0, 8).map(n => <NotifRow key={n.id} n={n} read={ns.isRead(n.id)} compact onClick={() => go(n)} />) : (
              <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <Icon name="checkCircle" size={26} style={{ color: "var(--green)" }} />
                <div style={{ marginTop: 6 }}>You&apos;re all caught up</div>
              </div>
            )}
          </div>
          {notifs.length > 0 && (
            <button onClick={() => { setOpen(false); if (onGoto) onGoto("__notifs"); }} style={{ display: "block", width: "100%", padding: "11px", border: 0, borderTop: "1px solid var(--line)", background: "var(--surface)", color: "var(--navy)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* full notifications page */
interface NotificationsPageProps {
  role: string;
  onOpen?: (page: string, sid?: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ role, onOpen }) => {
  const { students, letters, activeUserId, pendingItems, notificationLogs } = useAppContext();
  const ns = useNotifs();
  const [filter, setFilter] = useState("all");

  const notifs = useMemo(() => {
    return buildNotifs(role, students, letters, activeUserId, pendingItems, notificationLogs);
  }, [role, students, letters, activeUserId, pendingItems, notificationLogs]);

  const unread = notifs.filter(n => !ns.isRead(n.id));
  
  let rows = notifs;
  if (filter === "unread") rows = notifs.filter(n => !ns.isRead(n.id));
  else if (filter !== "all") rows = notifs.filter(n => n.cat === filter);

  const cats = [
    { v: "all", l: "All" }, 
    { v: "unread", l: "Unread (" + unread.length + ")" },
    { v: "action", l: "Action needed" }, 
    { v: "alert", l: "Alerts" }, 
    { v: "update", l: "Updates" },
  ];

  function go(n: AppNotification) { 
    ns.markRead(n.id); 
    if (onOpen) onOpen(n.page, n.sid); 
  }

  return (
    <div>
      <SectionTitle style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        Notifications
      </SectionTitle>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 10px', maxWidth: 600 }}>
          Everything that needs your attention, in one place — reminders and alerts are also emailed.
        </p>
        <div>
          {unread.length > 0 ? (
            <button className="btn btn-ghost" onClick={() => ns.markAllRead(notifs.map(n => n.id))}>
              <Icon name="check" size={15} /> Mark all read
            </button>
          ) : (
            <Badge tone="green" dot>All read</Badge>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {cats.map(c => <button key={c.v} className={"chip" + (filter === c.v ? " active" : "")} onClick={() => setFilter(c.v)}>{c.l}</button>)}
      </div>
      <div className="card" style={{ overflow: "hidden", maxWidth: 760 }}>
        {rows.length ? rows.map(n => <NotifRow key={n.id} n={n} read={ns.isRead(n.id)} onClick={() => go(n)} />) : (
          <EmptyState icon="checkCircle" title="Nothing here" sub="No notifications match this filter." />
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, fontSize: 12, color: "var(--ink-3)", maxWidth: 760 }}>
        <Icon name="mail" size={14} /> Action items and alerts are also delivered by email to your AAUCA address.
      </div>
    </div>
  );
};
