import React, { useState, useEffect, useCallback } from 'react';
import { studentsApi } from '../api/students';
import { proposalsApi } from '../api/proposals';
import { supervisionApi } from '../api/supervision';
import { panelsApi } from '../api/panels';
import { mapStudent, mapProposalAttempt } from '../utils/mappers';
import { getToken } from '../api/client';
import { notify } from '../components/LetterUI';
import {
  Icon,
  Badge,
  Avatar,
  StateTracker,
  EmptyState,
  SectionTitle,
} from '../components/SharedUI';
import { WeeklyAvailabilityGrid, DAY_MAP } from '../components/AvailabilityUI';
import type { Student, ProposalAttempt } from '../types';
import type { AvailabilitySlotResponse, PanelAssignmentResponse } from '../api/types';

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
  COMPLETED:             { label: 'Completed',                next: 'Congratulations! Your Final Year Project is complete.',                         color: 'green',  done: true  },
  WITHDRAWN:             { label: 'Withdrawn',                next: 'Your registration has been withdrawn. Contact your HOD.',        color: 'red',    done: true  },
};

/* Hook: loads the real student record for the logged-in user */
function useMyStudent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getToken()) { setLoaded(true); return; }
    setLoaded(false);
    studentsApi.me()
      .then(r => setStudent(mapStudent(r)))
      .catch(() => setStudent(null))
      .finally(() => setLoaded(true));
  }, [reloadKey]);

  return { student, loaded, reload: () => setReloadKey(k => k + 1) };
}

// Picks the panel a student should see for a given type: the pending one if there's an
// unresolved attempt in progress, otherwise the most recent (highest-attempt) resolved one.
function pickActivePanel(
  list: PanelAssignmentResponse[],
  type: 'PRE_DEFENSE' | 'DEFENSE'
): PanelAssignmentResponse | null {
  const forType = list.filter(p => p.panelType === type);
  return forType.find(p => !p.outcome)
    ?? [...forType].sort((a, b) => b.attemptNumber - a.attemptNumber)[0]
    ?? null;
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
  const { student: stu, loaded, reload } = useMyStudent();
  const [proposals, setProposals] = useState<ProposalAttempt[]>([]);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [preDefensePanel, setPreDefensePanel] = useState<PanelAssignmentResponse | null>(null);
  const [defensePanel, setDefensePanel] = useState<PanelAssignmentResponse | null>(null);

  const loadProposals = useCallback(async (stuId: string) => {
    try {
      const r = await proposalsApi.history(stuId);
      setProposals(r.map(mapProposalAttempt));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!stu) return;
    loadProposals(stu.id);
    panelsApi.byStudent(stu.id)
      .then(list => {
        setPreDefensePanel(pickActivePanel(list, 'PRE_DEFENSE'));
        setDefensePanel(pickActivePanel(list, 'DEFENSE'));
      })
      .catch(() => { setPreDefensePanel(null); setDefensePanel(null); });
  }, [stu?.id, loadProposals]);

  async function handleSubmitProposal() {
    if (!stu) return;
    setSubmittingProposal(true);
    try {
      await proposalsApi.submit(stu.id, proposalFile ?? undefined);
      notify('Proposal submitted — awaiting review', 'success');
      setProposalFile(null);
      reload();
      await loadProposals(stu.id);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Submission failed', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  }

  async function handleViewRequirements() {
    if (!stu) return;
    try {
      const token = localStorage.getItem('fyp_jwt');
      const res = await fetch('/api/students/me/requirements-doc', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { notify('Requirements document not available yet.', 'error'); return; }
      const url = URL.createObjectURL(await res.blob());
      window.open(url, '_blank');
    } catch { notify('Could not load requirements document.', 'error'); }
  }

  if (!loaded) return <EmptyState title="Loading your profile…" sub="" />;
  if (!stu) return NO_PROFILE;

  const stateName = Object.keys(STATE_META)[stu.stateIndex] ?? 'REGISTERED';
  const currentMeta = STATE_META[stateName] ?? STATE_META['REGISTERED'];
  const nextActionText = (stu.stateIndex === 7 && stu.bookSignedOff)
    ? 'Your supervisor has approved your book. Bring the final printed/bound copy to the HOD office for official submission.'
    : (stu.stateIndex === 10 && defensePanel?.outcome === 'REFERRED')
    ? 'Your defense was referred for minor corrections. See the examiner\'s note below and contact your HOD about next steps.'
    : (stu.stateIndex === 10 && defensePanel?.outcome === 'FAILED')
    ? 'Your defense outcome was recorded as failed. Contact your HOD about re-defense arrangements.'
    : currentMeta.next;

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
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{nextActionText}</p>
      </div>

      {/* Proposal submission — only at PROTOTYPE_GRANTED or PROPOSAL_UNDER_REVIEW */}
      {(stu.stateIndex === 4 || stu.stateIndex === 5) && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--navy)' }}>Research Proposal</div>
          {stu.proposalLocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid #F5C6C6', borderRadius: 9 }}>
              <Icon name="alert" size={18} style={{ color: 'var(--red)', flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red-deep)' }}>Proposal submissions locked</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>You have reached the maximum 3 rejections. Contact your HOD to unlock further submissions.</div>
              </div>
            </div>
          ) : stu.stateIndex === 5 && proposals.length > 0 && proposals[proposals.length - 1].status === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--blue-bg)', border: '1px solid #C7DCF1', borderRadius: 9 }}>
              <Icon name="clock" size={18} style={{ color: 'var(--blue)', flex: 'none' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--blue)' }}>Proposal under review</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>Attempt {proposals.length} has been submitted and is awaiting a decision from your HOD or Facilitator.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                {stu.stateIndex === 4
                  ? 'Your prototype has been approved. Upload your proposal PDF and submit.'
                  : `Attempt ${proposals.length} was rejected. Upload your revised proposal and resubmit (${3 - proposals.length} attempt${3 - proposals.length !== 1 ? 's' : ''} remaining).`
                }
              </div>
              {(stu as any).requirementsFileName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid #C7DCF1', borderRadius: 8 }}>
                  <Icon name="file" size={16} style={{ color: 'var(--blue)', flex: 'none' }} />
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', flex: 1 }}>Prototype requirements document available</span>
                  <button className="btn btn-quiet btn-sm" style={{ fontSize: 12 }} onClick={handleViewRequirements}>
                    Download
                  </button>
                </div>
              )}
              <div>
                <label className="field-label">Attach your proposal PDF <span className="muted">(required)</span></label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'block', marginTop: 6, fontSize: 13 }}
                  onChange={e => setProposalFile(e.target.files?.[0] ?? null)}
                />
                {proposalFile && (
                  <div style={{ marginTop: 5, fontSize: 12, color: 'var(--green)' }}>✓ {proposalFile.name}</div>
                )}
              </div>
              <div>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitProposal}
                  disabled={submittingProposal || !proposalFile}
                  style={{ justifySelf: 'start' }}
                >
                  <Icon name="send" size={15} />
                  {submittingProposal ? 'Submitting…' : stu.stateIndex === 4 ? 'Submit Proposal' : 'Resubmit Proposal'}
                </button>
                {!proposalFile && (
                  <p style={{ fontSize: 12, color: 'var(--amber-deep)', margin: '6px 0 0' }}>Attach your proposal PDF before submitting.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Pre-Defense Panel */}
      {stu.stateIndex >= 9 && (
        <div className="card card-pad" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Pre-Defense Panel</div>
          {preDefensePanel ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={preDefensePanel.examinerName} role="Examiner" size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{preDefensePanel.examinerName}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Your examiner</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={14} style={{ color: 'var(--ink-3)' }} />
                {preDefensePanel.scheduledAt
                  ? new Date(preDefensePanel.scheduledAt).toLocaleString()
                  : 'Date not yet set'}
              </div>
              {preDefensePanel.outcome && (
                <Badge tone={preDefensePanel.outcome === 'CLEARED' ? 'green' : 'red'} dot>
                  {preDefensePanel.outcome === 'CLEARED' ? 'Cleared to defend' : preDefensePanel.outcome}
                </Badge>
              )}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No examiner assigned yet.</div>
          )}
        </div>
      )}

      {/* Defense Panel */}
      {stu.stateIndex >= 10 && (
        <div className="card card-pad" style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            Final Defense
            {defensePanel && defensePanel.attemptNumber > 1 && <Badge tone="amber">Attempt {defensePanel.attemptNumber}</Badge>}
          </div>
          {defensePanel ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={defensePanel.examinerName} role="Examiner" size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{defensePanel.examinerName}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Your examiner</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={14} style={{ color: 'var(--ink-3)' }} />
                {defensePanel.scheduledAt
                  ? new Date(defensePanel.scheduledAt).toLocaleString()
                  : 'Date not yet set'}
              </div>
              {defensePanel.outcome ? (
                <>
                  <Badge
                    tone={defensePanel.outcome === 'PASSED' ? 'green' : defensePanel.outcome === 'REFERRED' ? 'amber' : 'red'}
                    dot
                  >
                    {defensePanel.outcome === 'PASSED' ? 'Passed'
                      : defensePanel.outcome === 'REFERRED' ? 'Referred — minor corrections required'
                      : 'Failed — re-defense required'}
                  </Badge>
                  {defensePanel.outcomeNote && (
                    <div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                      {defensePanel.outcomeNote}
                    </div>
                  )}
                </>
              ) : (
                <Badge tone="amber" dot>Awaiting outcome</Badge>
              )}
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>No examiner assigned yet.</div>
          )}
        </div>
      )}

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
  const { student: stu, loaded, reload } = useMyStudent();
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState('');
  const [org, setOrg] = useState('');
  const [group, setGroup] = useState('');
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [letterFile, setLetterFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (stu) {
      setTopic(stu.topic || '');
      setOrg(stu.org || '');
      setGroup(stu.group || '');
      setDetailsSaved(!!(stu.topic && stu.org));
    }
  }, [stu?.id]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await studentsApi.updateMyDetails({ projectTopic: topic, organisation: org, groupLabel: group });
      setDetailsSaved(true);
      reload();
      notify('Details saved', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Failed to save details', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitLetter() {
    setSubmitting(true);
    try {
      // Always save details before submitting so the backend has the latest values
      await studentsApi.updateMyDetails({ projectTopic: topic, organisation: org, groupLabel: group });
      await studentsApi.submitCaseLetter(letterFile || undefined);
      notify('Case study letter submitted — awaiting HOD review', 'success');
      reload();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return <EmptyState title="Loading…" sub="" />;
  if (!stu) return NO_PROFILE;

  const stateIndex = stu.stateIndex;
  const canSubmit = (topic.trim() || stu.topic) && (org.trim() || stu.org);

  return (
    <div>
      <SectionTitle sub="Your case study letter tracks the first stage of your final year project registration.">Case-Study Letter</SectionTitle>

      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: stateIndex >= 2 ? 'var(--green-bg)' : stateIndex === 1 ? 'var(--amber-bg)' : 'var(--blue-bg)', color: stateIndex >= 2 ? 'var(--green)' : stateIndex === 1 ? 'var(--amber-deep)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon name={stateIndex >= 2 ? 'checkCircle' : stateIndex === 1 ? 'clock' : 'file'} size={24} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              {stateIndex === 0 && 'Fill in your project details and submit'}
              {stateIndex === 1 && 'Letter submitted — under HOD review'}
              {stateIndex >= 2 && 'Case letter approved ✓'}
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
              {stateIndex === 0 && 'Enter your project topic and organisation, then submit your case study letter to the HOD.'}
              {stateIndex === 1 && 'Your letter has been received by the HOD and is being reviewed.'}
              {stateIndex >= 2 && 'Your case study letter was approved. You have advanced to the prototyping stage.'}
            </div>
          </div>
        </div>

        {stateIndex === 0 && (
          <form onSubmit={handleSaveDetails} style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
            <div>
              <label className="field-label">Project topic <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                className="input"
                required
                placeholder="e.g. Smart Attendance Management System"
                value={topic}
                onChange={e => { setTopic(e.target.value); setDetailsSaved(false); }}
              />
            </div>
            <div>
              <label className="field-label">Case study organisation <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                className="input"
                required
                placeholder="e.g. Bank of Kigali"
                value={org}
                onChange={e => { setOrg(e.target.value); setDetailsSaved(false); }}
              />
            </div>
            <div>
              <label className="field-label">Group / cohort label <span className="muted">(optional)</span></label>
              <input
                className="input"
                placeholder="e.g. A"
                value={group}
                onChange={e => { setGroup(e.target.value); setDetailsSaved(false); }}
              />
            </div>
            <button type="submit" className="btn btn-quiet btn-sm" disabled={saving} style={{ justifySelf: 'start' }}>
              {saving ? 'Saving…' : detailsSaved ? '✓ Details saved' : 'Save details'}
            </button>
          </form>
        )}

        {stateIndex >= 1 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            {[
              ['Project topic', stu.topic || '—'],
              ['Organisation', stu.org || '—'],
              ['Group', stu.group || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 13 }}>
                <span className="muted">{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line-soft)', fontSize: 13 }}>
              <span className="muted">Uploaded letter</span>
              {(stu as any).letterFileName ? (
                <button
                  className="btn btn-quiet btn-sm"
                  style={{ padding: '3px 10px', fontSize: 12 }}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('fyp_jwt');
                      const res = await fetch('/api/students/me/letter-file', {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      if (!res.ok) { alert('Letter file not available.'); return; }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    } catch { alert('Could not load letter file.'); }
                  }}
                >
                  View letter
                </button>
              ) : (
                <span style={{ fontWeight: 500 }}>—</span>
              )}
            </div>
          </div>
        )}

        {stateIndex === 0 && stu.letterRejectionReason && (
          <div style={{ padding: '12px 14px', background: 'var(--red-bg, #FFF0F0)', border: '1px solid #FFCCCC', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--red, #C0392B)', marginBottom: 4 }}>Letter returned for revision</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{stu.letterRejectionReason}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>Update your details below and resubmit.</div>
          </div>
        )}

        {stateIndex === 0 && (
          <div style={{ marginBottom: 16, display: 'grid', gap: 12 }}>
            <div>
              <label className="field-label">
                Upload letter from organisation <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(PDF, Word, or image)</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => setLetterFile(e.target.files?.[0] || null)}
                style={{ display: 'block', marginTop: 6, fontSize: 13 }}
              />
              {letterFile && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--green)' }}>
                  ✓ {letterFile.name}
                </div>
              )}
            </div>
            {!canSubmit && (
              <p style={{ fontSize: 12.5, color: 'var(--amber-deep)', margin: 0 }}>
                Fill in your project topic and organisation above before submitting.
              </p>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSubmitLetter}
              disabled={submitting || !canSubmit}
              style={{ justifySelf: 'start' }}
            >
              <Icon name="send" size={15} />
              {submitting ? 'Submitting…' : stu.letterRejectionReason ? 'Resubmit Case Study Letter' : 'Submit Case Study Letter'}
            </button>
          </div>
        )}

        <div style={{ padding: '11px 14px', background: 'var(--surface)', borderRadius: 9, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          {stateIndex === 0
            ? 'The HOD reviews all submitted letters and will notify you of the outcome within a few working days.'
            : 'Letter submission and review is managed by your HOD. You will be notified when action is required.'}
        </div>
      </div>
    </div>
  );
};

/* ─── StudentSupervisor ─── */
export const StudentSupervisor: React.FC = () => {
  const { student: stu, loaded } = useMyStudent();
  const [slots, setSlots] = useState<AvailabilitySlotResponse[]>([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  useEffect(() => {
    if (!stu?.supervisorId) return;
    setSlotsLoaded(false);
    supervisionApi.slotsBySupervisor(stu.supervisorId)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoaded(true));
  }, [stu?.supervisorId]);

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

  const gridSlots: { [k: string]: number } = {};
  let location: string | null = null;
  for (const s of slots) {
    const dayAbbr = Object.entries(DAY_MAP).find(([, v]) => v === s.dayOfWeek)?.[0];
    if (dayAbbr) gridSlots[dayAbbr + '-' + s.startTime] = 1;
    if (s.location) location = s.location;
  }

  return (
    <div>
      <SectionTitle sub="Your assigned supervisor's contact details and availability.">My Supervisor</SectionTitle>

      <div className="card card-pad" style={{ maxWidth: 560, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <Avatar name={stu.supervisorName} role="Supervisor" size={52} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{stu.supervisorName}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Your Supervisor</div>
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

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-hd"><h3>Weekly office hours</h3></div>
        <div className="card-pad">
          {!slotsLoaded ? (
            <div className="muted" style={{ fontSize: 13 }}>Loading availability…</div>
          ) : slots.length === 0 ? (
            <EmptyState icon="calendar" title="No office hours published yet" sub="Your supervisor hasn't published their weekly availability." />
          ) : (
            <>
              <WeeklyAvailabilityGrid slots={gridSlots} readOnly />
              {location && (
                <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                  <Icon name="building" size={14} style={{ color: 'var(--ink-3)' }} /> {location}
                </div>
              )}
            </>
          )}
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
    proposalsApi.history(stu.id).then(r => setProposals(r.map(mapProposalAttempt))).catch(() => {/* ignore */});
  }, [stu?.id]);

  if (!loaded) return <EmptyState title="Loading…" sub="" />;
  if (!stu) return NO_PROFILE;

  const reached = stu.stateIndex;

  return (
    <div>
      <SectionTitle sub="Every milestone in your final year journey — where you've been and where you're going.">My Timeline</SectionTitle>

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
                    {i === reached && stu.enteredStageTs && (
                      <span className="muted" style={{ fontSize: 11.5, marginLeft: 8, fontWeight: 400 }}>
                        since {new Date(stu.enteredStageTs).toLocaleDateString()}
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
