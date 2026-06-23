import React, { useState, useEffect } from 'react';
import { studentsApi } from '../api/students';
import { proposalsApi } from '../api/proposals';
import { mapStudent, mapProposalAttempt } from '../utils/mappers';
import { getToken } from '../api/client';
import {
  Icon,
  Badge,
  Avatar,
  StateTracker,
  EmptyState,
  SectionTitle,
} from '../components/SharedUI';
import { notify } from '../components/LetterUI';
import type { Student, ProposalAttempt } from '../types';
import { usersApi } from '../api/users';
import { ChangePasswordCard } from './SupervisorDashboard';

interface NavProps { onNav: (view: string) => void; }

/* State machine metadata */
const STATE_META: Record<string, { label: string; next: string; color: string; done: boolean }> = {
  REGISTERED:            { label: 'Registered',               next: 'Wait for the HOD to request your case study letter.',             color: 'blue',   done: false },
  CASE_LETTER_SUBMITTED: { label: 'Case Letter Submitted',    next: 'Your letter is under review by the HOD.',                         color: 'amber',  done: false },
  CASE_LETTER_APPROVED:  { label: 'Case Letter Approved',     next: 'Present your prototype to the panel.',                            color: 'green',  done: false },
  PROTOTYPE_REVIEW:      { label: 'Prototype Review',         next: 'Your prototype is being reviewed. Re-presentations may occur.',   color: 'amber',  done: false },
  PROTOTYPE_GRANTED:     { label: 'Prototype Granted',        next: 'Submit your research proposal.',                                  color: 'green',  done: false },
  PROPOSAL_UNDER_REVIEW: { label: 'Proposal Under Review',   next: 'Your proposal is being reviewed. Max 3 attempts.',                color: 'amber',  done: false },
  PROPOSAL_ACCEPTED:     { label: 'Proposal Accepted',        next: 'Your supervisor will be assigned and supervision begins.',        color: 'green',  done: false },
  SUPERVISION:           { label: 'Under Supervision',        next: 'Attend scheduled meetings and work on your final year book.',     color: 'navy',   done: false },
  BOOK_SUBMITTED:        { label: 'Book Submitted',           next: 'Your book is submitted. Await pre-defense scheduling.',          color: 'violet', done: false },
  PRE_DEFENSE:           { label: 'Pre-Defense',              next: 'Prepare for your pre-defense presentation.',                     color: 'violet', done: false },
  DEFENSE:               { label: 'Final Defense',            next: 'Prepare for your final defense.',                                color: 'violet', done: false },
  COMPLETED:             { label: 'Completed',                next: 'Congratulations! Your FYP is complete.',                         color: 'green',  done: true  },
  WITHDRAWN:             { label: 'Withdrawn',                next: 'Your registration has been withdrawn. Contact your HOD.',        color: 'red',    done: true  },
};

/* Hook: loads the real student record for the logged-in user */
function useMyStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!getToken()) { setLoaded(true); return; }
    setLoaded(false);
    studentsApi.me()
      .then(r => setStudent(mapStudent(r)))
      .catch(() => setStudent(null))
      .finally(() => setLoaded(true));
  }, []);

  return { student, loaded };
}

const NO_PROFILE = (
  <EmptyState
    icon="users"
    title="No student profile found"
    sub="Your account exists but has no student record. Ask your admin to import students via Excel. Your default password will be your registration number."
  />
);

/* ─── StudentDashboard ─── */
export const StudentDashboard: React.FC<NavProps> = ({ onNav }) => {
  const { student: stu, loaded } = useMyStudent();
  const [proposals, setProposals] = useState<ProposalAttempt[]>([]);

  useEffect(() => {
    if (!stu) return;
    proposalsApi.history(stu.id).then(r => setProposals(r.map(mapProposalAttempt))).catch(() => {});
  }, [stu?.id]);

  if (!loaded) return <EmptyState title="Loading your profile…" sub="" />;
  if (!stu) return NO_PROFILE;

  const meta = STATE_META[stu.stateIndex >= 12 ? 'WITHDRAWN' : Object.keys(STATE_META)[stu.stateIndex]] ?? STATE_META['REGISTERED'];
  const stateName = Object.keys(STATE_META)[stu.stateIndex] ?? 'REGISTERED';
  const currentMeta = STATE_META[stateName] ?? STATE_META['REGISTERED'];

  return (
    <div>
      <SectionTitle>Welcome back, {stu.name.split(' ').slice(-1)[0]}</SectionTitle>
      <p className="muted" style={{ fontSize: 13, margin: '0 0 20px' }}>
        {stu.reg} · {stu.email}
      </p>

      {/* State tracker */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-hd">
          <h3>Your progress</h3>
          <Badge tone={currentMeta.color as any}>{currentMeta.label}</Badge>
        </div>
        <div className="card-pad" style={{ paddingTop: 10 }}>
          <StateTracker stateIndex={stu.stateIndex} attempts={proposals} protoPres={stu.protoPres} compact />
        </div>
      </div>

      {/* Next action */}
      <div className="card card-pad" style={{ marginBottom: 18, borderLeft: '4px solid var(--amber)', background: 'var(--amber-bg)' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>What happens next</div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{currentMeta.next}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Student details */}
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Your details</div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Registration', stu.reg],
                ['Group', stu.group || '—'],
                ['Organisation', stu.org || '—'],
                ['Project topic', stu.topic || 'Not set yet'],
                ['Prototype attempts', String(stu.protoPres)],
                ['Book signed off', stu.bookSignedOff ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <td style={{ padding: '7px 0', color: 'var(--ink-3)', width: '45%' }}>{label}</td>
                  <td style={{ padding: '7px 0', fontWeight: 500, color: 'var(--ink)' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Supervisor */}
        <div className="card card-pad">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Supervisor</div>
          {stu.supervisorName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={stu.supervisorName} role="Supervisor" size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{stu.supervisorName}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Your supervisor</div>
                </div>
              </div>
              {stu.supervisorEmail && (
                <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="mail" size={14} style={{ color: 'var(--ink-3)' }} />
                  <span className="mono">{stu.supervisorEmail}</span>
                </div>
              )}
              {stu.supervisorPhone && (
                <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="phone" size={14} style={{ color: 'var(--ink-3)' }} />
                  <span>{stu.supervisorPhone}</span>
                </div>
              )}
              <button className="btn btn-quiet btn-sm" onClick={() => onNav('supervisor')} style={{ marginTop: 4 }}>
                View availability <Icon name="arrowRight" size={13} />
              </button>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No supervisor assigned yet.</div>
          )}
        </div>
      </div>

      {/* Proposal attempts */}
      {proposals.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-hd"><h3>Proposal history</h3><Badge tone="navy">{proposals.length} / 3</Badge></div>
          <div className="card-pad">
            {proposals.map(p => (
              <div key={p.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <Badge tone={p.status === 'accepted' ? 'green' : p.status === 'rejected' ? 'red' : 'amber'}>
                  Attempt {p.n}
                </Badge>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>{p.reason || 'No note'}</span>
                <Badge tone={p.status === 'accepted' ? 'green' : p.status === 'rejected' ? 'red' : 'amber'}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── StudentCase ─── */
export const StudentCase: React.FC = () => {
  const { student: stu, loaded } = useMyStudent();

  if (!loaded) return <EmptyState title="Loading…" sub="" />;
  if (!stu) return NO_PROFILE;

  const stateIndex = stu.stateIndex;

  return (
    <div>
      <SectionTitle sub="Your case study letter tracks the first stage of your FYP registration.">Case-Study Letter</SectionTitle>

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: stateIndex >= 2 ? 'var(--green-bg)' : 'var(--blue-bg)', color: stateIndex >= 2 ? 'var(--green)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name={stateIndex >= 2 ? 'checkCircle' : 'file'} size={24} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              {stateIndex === 0 && 'Awaiting letter request from HOD'}
              {stateIndex === 1 && 'Letter submitted — under review'}
              {stateIndex >= 2 && 'Case letter approved ✓'}
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
              {stateIndex === 0 && 'The HOD will open a submission window for you. Check back soon.'}
              {stateIndex === 1 && 'Your letter has been received by the HOD and is being reviewed.'}
              {stateIndex >= 2 && 'Your case study letter was approved. You have advanced to the next stage.'}
            </div>
          </div>
        </div>

        <div style={{ padding: '11px 14px', background: 'var(--surface)', borderRadius: 9, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          <Icon name="info" size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          Letter submission and review is managed by your HOD. You will be notified when action is required.
        </div>
      </div>
    </div>
  );
};

/* ─── StudentSupervisor ─── */
export const StudentSupervisor: React.FC = () => {
  const { student: stu, loaded } = useMyStudent();

  if (!loaded) return <EmptyState title="Loading…" sub="" />;
  if (!stu) return NO_PROFILE;

  if (!stu.supervisorName) {
    return (
      <div>
        <SectionTitle sub="Your assigned supervisor's contact details and availability.">My Supervisor</SectionTitle>
        <EmptyState icon="users" title="No supervisor assigned yet" sub="Once a supervisor is assigned to you by the HOD or Facilitator, their details will appear here." />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle sub="Your assigned supervisor's contact details and availability.">My Supervisor</SectionTitle>

      <div className="card card-pad" style={{ maxWidth: 560, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Avatar name={stu.supervisorName} role="Supervisor" size={52} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{stu.supervisorName}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Your FYP Supervisor</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {stu.supervisorEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
              <Icon name="mail" size={16} style={{ color: 'var(--ink-3)', flex: 'none' }} />
              <span className="mono">{stu.supervisorEmail}</span>
            </div>
          )}
          {stu.supervisorPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
              <Icon name="phone" size={16} style={{ color: 'var(--ink-3)', flex: 'none' }} />
              <span>{stu.supervisorPhone}</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, padding: '11px 14px', background: 'var(--blue-bg)', border: '1px solid #C7DCF1', borderRadius: 9, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <Icon name="info" size={14} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--blue)' }} />
          Contact your supervisor via email to schedule meetings. All meetings are logged in the system.
        </div>
      </div>
    </div>
  );
};

/* ─── StudentTimeline ─── */
const STAGE_LABELS = [
  'Registered in cohort',
  'Case study letter submitted',
  'Case study letter approved',
  'Prototype presented to panel',
  'Prototype approved',
  'Proposal submitted',
  'Proposal accepted',
  'Active supervision',
  'Final book submitted',
  'Pre-defense',
  'Final defense',
  'Completed',
];

export const StudentTimeline: React.FC = () => {
  const { student: stu, loaded } = useMyStudent();
  const [proposals, setProposals] = useState<ProposalAttempt[]>([]);

  useEffect(() => {
    if (!stu) return;
    proposalsApi.history(stu.id).then(r => setProposals(r.map(mapProposalAttempt))).catch(() => {});
  }, [stu?.id]);

  if (!loaded) return <EmptyState title="Loading…" sub="" />;
  if (!stu) return NO_PROFILE;

  const reached = stu.stateIndex;

  return (
    <div>
      <SectionTitle sub="Every milestone in your FYP journey — where you've been and where you're going.">My Timeline</SectionTitle>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-pad" style={{ paddingTop: 10 }}>
          <StateTracker stateIndex={stu.stateIndex} attempts={proposals} protoPres={stu.protoPres} />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <div className="card-hd"><h3>Milestone history</h3></div>
        <div className="card-pad" style={{ display: 'grid', gap: 0 }}>
          {STAGE_LABELS.map((label, i) => {
            const done = i < reached;
            const current = i === reached;
            const future = i > reached;
            return (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i < STAGE_LABELS.length - 1 ? 20 : 0, position: 'relative' }}>
                {/* connector line */}
                {i < STAGE_LABELS.length - 1 && (
                  <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 2, background: done ? 'var(--green)' : 'var(--line)', opacity: done ? 0.5 : 0.3 }} />
                )}
                {/* dot */}
                <div style={{ width: 24, height: 24, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--green)' : current ? 'var(--amber)' : 'var(--line)', zIndex: 1 }}>
                  {done ? <Icon name="checkCircle" size={13} style={{ color: '#fff' }} /> : current ? <Icon name="activity" size={13} style={{ color: '#fff' }} /> : null}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 13.5, fontWeight: current ? 700 : done ? 500 : 400, color: future ? 'var(--ink-4)' : 'var(--ink)' }}>
                    {label}
                    {current && <Badge tone="amber" style={{ marginLeft: 8 }}>Current</Badge>}
                    {i === reached && stu.stateEnteredAt && (
                      <span className="muted" style={{ fontSize: 11.5, marginLeft: 8, fontWeight: 400 }}>
                        since {new Date(stu.stateEnteredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {/* Show proposal attempts inline */}
                  {i === 5 && proposals.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {proposals.map(p => (
                        <Badge key={p.n} tone={p.status === 'accepted' ? 'green' : p.status === 'rejected' ? 'red' : 'amber'}>
                          Attempt {p.n}: {p.status}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Show proto attempts inline */}
                  {i === 3 && stu.protoPres > 0 && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{stu.protoPres} presentation{stu.protoPres > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
