import type { 
  MilestoneState, 
  Supervisor, 
  Facilitator, 
  HOD as HODType, 
  Superadmin, 
  WhatsAppGroup, 
  Meeting, 
  GroupSession, 
  ProposalAttempt, 
  Student, 
  NotificationLog, 
  AuditLogEntry, 
  PendingCoordinationItem 
} from '../types';

export const STATES: MilestoneState[] = [
  { i: 0, key: "registered",   label: "Registered",            short: "Registered",   color: "navy"   },
  { i: 1, key: "case_sub",     label: "Case Letter Submitted",  short: "Case Sub.",    color: "blue"   },
  { i: 2, key: "case_appr",    label: "Case Letter Approved",   short: "Case Appr.",   color: "green"  },
  { i: 3, key: "proto_review", label: "Prototype Review",       short: "Proto Review", color: "violet", external: true },
  { i: 4, key: "proto_grant",  label: "Prototype Granted",      short: "Proto Grant",  color: "green"  },
  { i: 5, key: "prop_review",  label: "Proposal Under Review",  short: "Proposal",     color: "blue"   },
  { i: 6, key: "prop_accept",  label: "Proposal Accepted",      short: "Prop. Acc.",   color: "green"  },
  { i: 7, key: "supervision",  label: "Supervision",            short: "Supervision",  color: "amber", focus: true },
  { i: 8, key: "book_sub",     label: "Book Submitted",         short: "Book Sub.",    color: "blue"   },
  { i: 9, key: "predefense",   label: "Pre-Defense",            short: "Pre-Defense",  color: "navy"   },
  { i: 10, key: "defense",      label: "Defense",                short: "Defense",      color: "navy", terminal: true },
];

export const stateByKey = Object.fromEntries(STATES.map(s => [s.key, s]));

export const SUPERVISORS: Supervisor[] = [
  { id: "sup-hab", name: "Dr. Habimana",   full: "Dr. Jean de Dieu Habimana", email: "jd.habimana@aauca.ac.rw", phone: "+250 788 412 067", title: "Senior Lecturer, SE", examiner: true },
  { id: "sup-uwi", name: "Ms. Uwimana",    full: "Ms. Claudine Uwimana",       email: "c.uwimana@aauca.ac.rw",   phone: "+250 788 330 145", title: "Lecturer, SE",        examiner: true },
  { id: "sup-niy", name: "Mr. Niyongabo",  full: "Mr. Patrick Niyongabo",      email: "p.niyongabo@aauca.ac.rw", phone: "+250 788 905 220", title: "Lecturer, Networks",  examiner: false },
  { id: "sup-muk", name: "Dr. Mukamana",   full: "Dr. Esperance Mukamana",     email: "e.mukamana@aauca.ac.rw",  phone: "+250 788 661 902", title: "Senior Lecturer, Data", examiner: true },
  { id: "sup-rwa", name: "Mr. Rwabukamba", full: "Mr. Eric Rwabukamba",        email: "e.rwabukamba@aauca.ac.rw",phone: "+250 788 277 410", title: "Lecturer, SE",        examiner: true },
];

export const supById = Object.fromEntries(SUPERVISORS.map(s => [s.id, s]));

export const FACILITATOR: Facilitator = { id: "fac-ing", name: "Ms. Ingabire", full: "Ms. Sandrine Ingabire", email: "s.ingabire@aauca.ac.rw", phone: "+250 788 600 318", title: "FYP Coordinator (Facilitator)" };
export const HOD: HODType = { id: "hod-biz", name: "Dr. Bizimungu", full: "Dr. Faustin Bizimungu", email: "f.bizimungu@aauca.ac.rw", phone: "+250 788 110 044", title: "Head of Department, Software Engineering", examiner: true };
export const SUPERADMIN: Superadmin = { id: "adm-001", name: "E. Manzi",      full: "Eric Manzi", email: "admin@aauca.ac.rw", phone: "+250 788 000 001", title: "System Owner / IT" };

// Register HOD as a supervisor too
supById[HOD.id] = { ...HOD, id: HOD.id } as unknown as Supervisor;

export const WA_GROUPS: { [supId: string]: WhatsAppGroup[] } = {
  "sup-hab": [
    { id: "wa-hab-a", team: "FYP 2026 · Group A", link: "https://chat.whatsapp.com/HbA26kXprototype" },
    { id: "wa-hab-b", team: "FYP 2026 · Group B", link: "https://chat.whatsapp.com/HbB26mQsupervise" },
  ],
  "sup-uwi": [ { id: "wa-uwi-c", team: "FYP 2026 · Group C", link: "https://chat.whatsapp.com/UwC26tHfypteam" } ],
  "sup-muk": [ { id: "wa-muk-d", team: "FYP 2026 · Data Track", link: "https://chat.whatsapp.com/MkD26dataTrk" } ],
  "sup-rwa": [ { id: "wa-rwa-a", team: "FYP 2026 · Group A2", link: "https://chat.whatsapp.com/RwA26buildgrp" } ],
  "sup-niy": [ { id: "wa-niy-n", team: "FYP 2026 · Networks", link: "https://chat.whatsapp.com/NyN26netgrp" } ],
  "hod-biz": [ { id: "wa-hod-h", team: "FYP 2026 · HOD Group", link: "https://chat.whatsapp.com/HodBiz26grp" } ],
};

export const PREDEFENSE_WA: { [supId: string]: WhatsAppGroup[] } = {
  "sup-hab": [ { id: "pd-hab", team: "FYP 2026 · Pre-Defense Panel A", link: "https://chat.whatsapp.com/PreDef26panelA" } ],
};

export const AVAILABILITY: { [supId: string]: { [slot: string]: any } } = {
  "sup-hab": { "Mon-10:00": 1, "Mon-11:00": 1, "Tue-14:00": 1, "Wed-09:00": 1, "Wed-10:00": 1, "Thu-15:00": 1, "Thu-16:00": 1, "Fri-11:00": 1, location: "Office B-204, ICT Building" },
  "sup-uwi": { "Mon-09:00": 1, "Tue-09:00": 1, "Tue-10:00": 1, "Thu-14:00": 1, "Fri-14:00": 1, "Fri-15:00": 1, location: "Office A-110" },
  "sup-niy": { "Wed-14:00": 1, "Wed-15:00": 1, "Wed-16:00": 1, "Fri-09:00": 1, "Fri-10:00": 1, location: "Networks Lab, B-Block" },
  "sup-muk": { "Mon-14:00": 1, "Mon-15:00": 1, "Tue-11:00": 1, "Thu-09:00": 1, "Thu-10:00": 1, "Thu-11:00": 1, location: "Data Lab C-210" },
  "sup-rwa": { "Mon-09:00": 1, "Mon-10:00": 1, "Wed-11:00": 1, "Thu-16:00": 1, "Fri-15:00": 1, "Fri-16:00": 1, location: "Office B-207" },
  "hod-biz": { "Tue-15:00": 1, "Tue-16:00": 1, "Thu-11:00": 1, "Fri-09:00": 1, location: "HOD Office, ICT Building (1st floor)" },
};

// Date helpers
export function dt(m: number, d: number, h?: number, min?: number): string {
  return new Date(2025 + (m < 7 ? 1 : 0), (m - 1) % 12, d, h || 10, min || 0).toISOString();
}

export function fmt(iso: string): string {
  const o = new Date(iso);
  return o.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtT(iso: string): string {
  const o = new Date(iso);
  return o.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fmtFull(iso: string): string {
  return fmt(iso) + " · " + fmtT(iso);
}

export function ago(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return "today";
  if (diff < 2) return "yesterday";
  if (diff < 14) return Math.floor(diff) + " days ago";
  return Math.floor(diff / 7) + " weeks ago";
}

export function bookDeadline(stu: Student): string {
  const d = new Date(stu.bookRegisteredTs);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export interface SemesterInfo {
  key: string;
  label: string;
  short: string;
  order: number;
  startYear: number;
  sem: number;
}

export function semesterOf(dateStr: string): SemesterInfo {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  let startYear: number;
  let sem: number;
  if (m >= 7) {
    startYear = y;
    sem = 1;
  } else if (m <= 0) {
    startYear = y - 1;
    sem = 1;
  } else {
    startYear = y - 1;
    sem = 2;
  }
  return {
    key: startYear + "-" + sem,
    label: startYear + "/" + (startYear + 1) + " · Sem " + (sem === 1 ? "I" : "II"),
    short: "Sem " + (sem === 1 ? "I" : "II") + " " + startYear,
    order: startYear * 2 + sem,
    startYear,
    sem
  };
}

export function currentSemester(): SemesterInfo {
  return semesterOf(new Date().toISOString());
}

export const GROUP_SESSIONS: GroupSession[] = [
  { id: "gs-hab-1", supervisorId: "sup-hab", title: "Kick-off — FYP process & expectations", ts: dt(2, 9, 10, 0), durationMin: 90, type: "inperson", location: "Room B-204", agenda: "Walkthrough of the 11 stages, deadlines, deliverables, and how supervision works. Bring your case study.", attendanceTaken: true, attendance: { "STU-2026-014": "present" } },
  { id: "gs-hab-2", supervisorId: "sup-hab", title: "Proposal-writing clinic (all students)", ts: dt(2, 23, 10, 0), durationMin: 60, type: "meet", link: "meet.google.com/hab-clinic-01", agenda: "Common proposal pitfalls; objectives must be SMART; live Q&A.", attendanceTaken: true, attendance: { "STU-2026-014": "present" } },
  { id: "gs-hab-3", supervisorId: "sup-hab", title: "Mid-term progress checkpoint", ts: dt(6, 24, 14, 0), durationMin: 90, type: "inperson", location: "Room B-204", agenda: "Each student gives a 5-minute status update. Mandatory.", attendanceTaken: false },
  { id: "gs-uwi-1", supervisorId: "sup-uwi", title: "Group orientation session", ts: dt(2, 11, 9, 0), durationMin: 60, type: "inperson", location: "Room A-110", agenda: "Process overview and milestone calendar.", attendanceTaken: true },
  { id: "gs-muk-1", supervisorId: "sup-muk", title: "Data-track kickoff", ts: dt(2, 10, 14, 0), durationMin: 90, type: "meet", link: "meet.google.com/muk-data-kick", agenda: "Datasets, ethics approval, and methodology basics.", attendanceTaken: true },
  { id: "gs-hod-1", supervisorId: "hod-biz", title: "HOD supervisees — kick-off", ts: dt(2, 12, 15, 0), durationMin: 60, type: "inperson", location: "HOD Office", agenda: "Process overview for students I supervise directly.", attendanceTaken: true },
];

export const ORGS = ["Bank of Kigali", "Irembo", "MTN Rwanda", "Rwanda Revenue Authority", "BK Tech House", "Zipline Rwanda", "Kigali Heights Clinic", "SP Energy", "Equity Bank", "RSSB", "AC Group (Tap&Go)", "Inkomoko"];
export const TOPICS = [
  "Queue management system", "Mobile loan-scoring app", "Clinic appointment portal", "Fleet tracking dashboard",
  "Digital ID verification", "Cold-chain monitoring IoT", "School fees payment gateway", "HR leave-management system",
  "Agri marketplace platform", "Tele-consultation app", "Inventory & POS system", "Citizen feedback portal",
  "E-ticketing platform", "Smart attendance system", "Microfinance ledger", "Waste-collection scheduler",
];

export const NAMES = [
  "Keza Ihirwe", "Mugisha Eric", "Uwase Diane", "Niyonsaba Patrick", "Ineza Sandrine", "Mutoni Aline",
  "Gatete Yves", "Iradukunda Kevin", "Umutoni Clarisse", "Bizimana Olivier", "Mukamana Josiane", "Hakizimana Jean",
  "Ishimwe Grace", "Rwema Fabrice", "Uwineza Chantal", "Manzi Bruno", "Karangwa David", "Mukantwari Ange",
  "Niyigena Samuel", "Cyiza Belinda", "Habineza Eric", "Umuhoza Solange", "Ndayisaba Pacifique", "Kabera Emmanuel",
  "Mukeshimana Divine", "Tuyishime Aimable", "Ineza Gloria", "Nkurunziza Thierry", "Uwamahoro Peace", "Mugabo Alvin",
  "Murenzi Caleb", "Kamanzi Ruth", "Dushime Yvan", "Munyaneza Frank", "Umurerwa Linda", "Gasana Herve",
  "Mukamurenzi Yvette", "Rugema Steve", "Ishimwe Pamela", "Nshadow Bosco",
];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const initials = (n: string) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const slugEmail = (n: string) => n.toLowerCase().split(" ").reverse().join(".") + "@stu.aauca.ac.rw";

function defaultAttempts(stateIndex: number, r: () => number): ProposalAttempt[] {
  if (stateIndex < 5) return [];
  if (stateIndex === 5) return [
    { n: 1, ts: dt(3, 18, 9, 30), status: "rejected", reason: "Scope too broad; objectives not measurable." },
    { n: 2, ts: dt(4, 2, 10, 0),  status: "pending"  }
  ];
  if (r() < 0.4) return [
    { n: 1, ts: dt(3, 18, 9, 0), status: "rejected", reason: "Methodology section incomplete." },
    { n: 2, ts: dt(4, 4, 11, 0), status: "accepted" }
  ];
  return [
    { n: 1, ts: dt(3, 20, 10, 0), status: "accepted" }
  ];
}

function stageEntryTs(stateIndex: number, _seed: number): string {
  const base = [dt(10, 2), dt(10, 14), dt(10, 28), dt(11, 8), dt(11, 20), dt(12, 4), dt(1, 10), dt(2, 3), dt(5, 20), dt(6, 1), dt(6, 7)];
  return base[stateIndex] || dt(10, 2);
}

function bookRegTs(seed: number, si: number): string {
  const siVal = si || 0;
  const DAY = 86400000;
  const r = seed % 10;
  let frac = siVal / 10;
  frac += (((seed * 7) % 7) - 3) * 0.02;
  if (r === 0) frac += 0.32;
  else if (r === 1) frac += 0.17;
  frac = Math.max(0.02, Math.min(0.99, frac));
  const daysAgo = Math.round(frac * 365);
  return new Date(Date.now() - daysAgo * DAY).toISOString();
}

function eligibleExaminerFor(supId: string | null, seed: number): string {
  const pool = SUPERVISORS.filter(s => s.examiner && s.id !== supId);
  return pool[seed % pool.length].id;
}

export function buildMockStudents(): Student[] {
  const list: Student[] = [];
  let idx = 1;

  function mk(seedVal: number, stateIndex: number, opts: Partial<Student> = {}): Student {
    const r = rng(seedVal * 97 + 13);
    const name = opts.name || NAMES[seedVal % NAMES.length];
    const groupLetter = opts.group || ["A", "B", "C", "D"][seedVal % 4];
    const supId = opts.supervisorId !== undefined ? opts.supervisorId
                  : (stateIndex >= 7 ? SUPERVISORS[seedVal % SUPERVISORS.length].id : null);
    const protoPres = opts.protoPres !== undefined ? opts.protoPres : (stateIndex >= 4 ? 1 : (stateIndex === 3 ? 1 : 0));
    const attempts = opts.attempts || defaultAttempts(stateIndex, r);
    
    const s: Student = {
      id: opts.id || ("STU-2026-" + String(100 + idx).slice(1)),
      userId: opts.userId || ("usr-" + String(100 + idx).slice(1)),
      reg: "26" + String(1000 + (seedVal * 7) % 8999),
      name,
      initials: initials(name),
      email: opts.email || slugEmail(name),
      phone: "+250 78" + (1 + seedVal % 8) + " " + (100 + (seedVal * 3) % 900) + " " + (100 + (seedVal * 7) % 900),
      group: "Group " + groupLetter,
      org: opts.org || ORGS[seedVal % ORGS.length],
      topic: opts.topic || TOPICS[seedVal % TOPICS.length],
      stateIndex,
      supervisorId: supId,
      supervisorName: opts.supervisorName ?? (supId ? (SUPERVISORS.find(s => s.id === supId)?.name ?? null) : null),
      supervisorEmail: opts.supervisorEmail ?? (supId ? (SUPERVISORS.find(s => s.id === supId)?.email ?? null) : null),
      supervisorPhone: opts.supervisorPhone ?? (supId ? (SUPERVISORS.find(s => s.id === supId)?.phone ?? null) : null),
      examinerPreId: opts.examinerPreId || (stateIndex >= 9 ? eligibleExaminerFor(supId, seedVal) : null),
      examinerDefId: opts.examinerDefId || (stateIndex >= 10 ? eligibleExaminerFor(supId, seedVal + 1) : null),
      protoPres,
      attempts,
      nextMeeting: opts.nextMeeting !== undefined ? opts.nextMeeting
                   : (stateIndex === 7 ? { ts: dt(6, 12 + (seedVal % 6), 14, 0), confirmed: (seedVal % 3 !== 0) } : null),
      bookSignedOff: stateIndex >= 8,
      proposalLocked: !!opts.proposalLocked,
      flagged: !!opts.flagged,
      defense: opts.defense || (stateIndex >= 10 ? { outcome: "Passed with minor corrections", panel: "Panel 2", ts: dt(6, 7, 11, 0) } : null),
      predefenseStatus: opts.predefenseStatus || (stateIndex >= 9 ? (stateIndex > 9 ? "Cleared to defend" : "Scheduled") : null),
      enteredStageTs: opts.enteredStageTs || stageEntryTs(stateIndex, seedVal),
      bookRegisteredTs: opts.bookRegisteredTs || bookRegTs(seedVal, stateIndex),
      note: opts.note || null,
    };
    idx++;
    return s;
  }

  // Add standard demo "hero" students
  const heroKeza = mk(1001, 7, {
    id: "STU-2026-014", name: "Keza Ihirwe", group: "A", org: "Bank of Kigali",
    topic: "Queue management system", supervisorId: "sup-hab",
    attempts: [
      { n: 1, ts: dt(11, 28, 9, 0), status: "rejected", reason: "Objectives not measurable; success criteria missing." },
      { n: 2, ts: dt(12, 9, 10, 0),  status: "accepted" },
    ],
    nextMeeting: { ts: dt(6, 12, 14, 0), confirmed: true },
    flagged: true, protoPres: 2,
    note: "Complaint filed 06 Jun: 'supervisor unresponsive, missed sign-off'. Resolved from timeline.",
  });

  const heroMugisha = mk(1002, 7, {
    id: "STU-2026-021", name: "Mugisha Eric", group: "B", org: "Irembo",
    topic: "Digital ID verification", supervisorId: "sup-muk", protoPres: 1,
    attempts: [
      { n: 1, ts: dt(12, 2, 9, 15),  status: "rejected", reason: "Problem statement lacks baseline data; objectives not SMART." },
      { n: 2, ts: dt(12, 16, 10, 0), status: "rejected", reason: "Literature review thin; no comparison of existing systems." },
      { n: 3, ts: dt(1, 8, 11, 30),  status: "accepted" },
    ],
    nextMeeting: { ts: dt(6, 13, 11, 0), confirmed: false },
  });

  const heroUwase = mk(1003, 4, {
    id: "STU-2026-008", name: "Uwase Diane", group: "A", org: "MTN Rwanda",
    topic: "Cold-chain monitoring IoT", supervisorId: null, protoPres: 3,
    attempts: [],
    note: "Prototype needed refinement twice before grant (3 presentations).",
  });

  const heroPatrick = mk(1004, 9, {
    id: "STU-2026-003", name: "Niyonsaba Patrick", group: "C", org: "Rwanda Revenue Authority",
    topic: "E-ticketing platform", supervisorId: "sup-uwi",
    examinerPreId: "sup-hab", protoPres: 1,
    attempts: [{ n: 1, ts: dt(12, 1, 9, 0), status: "accepted" }],
    nextMeeting: null, predefenseStatus: "Scheduled",
  });

  const regAline    = mk(2001, 0, { id: "STU-2026-041", name: "Mutoni Aline",      org: "Inkomoko",           topic: "Agri marketplace platform",  supervisorId: "sup-hab", bookRegisteredTs: dt(8, 12, 9, 0) });
  const regGatete   = mk(2002, 0, { id: "STU-2026-042", name: "Gatete Yves",       org: "AC Group (Tap&Go)",   topic: "E-ticketing platform",       bookRegisteredTs: dt(7, 3, 9, 0) });
  const regCyiza    = mk(2003, 0, { id: "STU-2026-043", name: "Cyiza Belinda",     org: "Equity Bank",         topic: "Microfinance ledger",        bookRegisteredTs: dt(9, 20, 9, 0) });
  const regKevin    = mk(2004, 0, { id: "STU-2026-044", name: "Iradukunda Kevin",  org: "RSSB",                topic: "HR leave-management system", bookRegisteredTs: dt(10, 5, 9, 0) });
  const regClarisse = mk(2005, 1, { id: "STU-2026-045", name: "Umutoni Clarisse",  org: "Zipline Rwanda",      topic: "Cold-chain monitoring IoT",  bookRegisteredTs: dt(8, 28, 9, 0) });

  list.push(heroKeza, heroMugisha, heroUwase, heroPatrick, regAline, regGatete, regCyiza, regKevin, regClarisse);

  // Fill in stage counts deterministically
  const DIST = [9, 4, 3, 4, 2, 5, 2, 9, 3, 3, 2];
  let seedVal = 2;
  DIST.forEach((count, st) => {
    for (let k = 0; k < count; k++) {
      list.push(mk(seedVal * 31 + st * 7 + k, st));
      seedVal++;
    }
  });

  // Assign direct supervisees to HOD
  list.filter(s => s.stateIndex === 7 && !s.flagged && s.supervisorId && s.supervisorId !== "sup-hab")
      .slice(0, 3)
      .forEach(s => { s.supervisorId = "hod-biz"; });

  return list;
}

export function meetingsFor(stu: Student): Meeting[] {
  if (stu.stateIndex < 7) return [];
  const list: Meeting[] = [
    { id: "m1", ts: dt(2, 13, 14, 0), setTs: dt(2, 8, 9, 0), confirmed: true, logged: true, topic: "Scope & milestones", attendance: "Present", notes: "Agreed on 4 modules; weekly check-ins. Action: ERD by next week." },
    { id: "m2", ts: dt(3, 6, 14, 0),  setTs: dt(3, 1, 9, 0),  confirmed: true, logged: true, topic: "ERD & DB review", attendance: "Present", notes: "DB schema reviewed; normalise payments table." },
    { id: "m3", ts: dt(3, 27, 14, 0), setTs: dt(3, 20, 9, 0), confirmed: true, logged: true, topic: "Auth module demo", attendance: stu.id === "STU-2026-014" ? "Absent" : "Present", notes: stu.id === "STU-2026-014" ? "Student absent — no prior notice. Rescheduled." : "Login flow OK; add input validation." },
  ];
  if (stu.id === "STU-2026-014") {
    list.push({ id: "m4", ts: dt(6, 12, 14, 0), setTs: dt(6, 8, 10, 0), confirmed: true, logged: false, topic: "Pre-submission review", attendance: "—", notes: "Upcoming — confirmed." });
  }
  return list;
}

export function timelineFor(stu: Student, supervisorsMap: { [id: string]: Supervisor }): any[] {
  const ev: any[] = [];
  const sup = supervisorsMap[stu.supervisorId || ""];
  const push = (o: any) => ev.push(o);
  
  const aHod = { name: HOD.name, role: "HOD" };
  const aFac = { name: FACILITATOR.name, role: "Facilitator" };
  const aStu = { name: stu.name, role: "Student" };
  const aSup = sup ? { name: sup.name, role: "Supervisor" } : null;
  const aExt = { name: "Prototype Review Board", role: "External" };
  const aExt2 = (ex: Supervisor | undefined) => ({ name: ex ? ex.name : "Examiner", role: "Examiner" });

  if (stu.stateIndex >= 0) push({ st: 0, label: "Registered in cohort Class of 2026", actor: aHod, ts: dt(10, 2, 9, 0), email: "reg-confirmed", note: `Uploaded via registered-student list · ${stu.group}` });
  if (stu.stateIndex >= 1) push({ st: 1, label: "Case-study letter submitted", actor: aStu, ts: dt(10, 16, 11, 20), note: `Case study: ${stu.org}`, file: "case-letter.pdf" });
  if (stu.stateIndex >= 2) push({ st: 2, label: "Case letter approved", actor: aHod, ts: dt(10, 24, 15, 5), email: "case-approved" });
  if (stu.stateIndex >= 3) {
    push({ st: 3, label: "Entered Prototype Review (external)", actor: aFac, ts: dt(11, 4, 9, 0), external: true });
    for (let p = 1; p < stu.protoPres; p++) {
      push({ st: 3, kind: "rework", label: `Prototype needs refinement — re-presentation #${p + 1}`, actor: aExt, ts: dt(11, 4 + p * 6, 14, 0), email: "proto-refine", count: p + 1 });
    }
  }
  if (stu.stateIndex >= 4) push({ st: 4, label: `Prototype granted${stu.protoPres > 1 ? ` (after ${stu.protoPres} presentations)` : ""}`, actor: aExt, ts: dt(11, 18, 16, 0), email: "proto-granted", external: true });
  if (stu.stateIndex >= 5) {
    (stu.attempts || []).forEach(a => {
      if (a.status === "rejected") push({ st: 5, kind: "rework", label: `Proposal rejected — attempt #${a.n}`, actor: aSup || aFac, ts: a.ts, email: "prop-rejected", reason: a.reason, count: a.n });
      else if (a.status === "pending") push({ st: 5, label: `Proposal resubmitted — attempt #${a.n} (under review)`, actor: aStu, ts: a.ts, count: a.n });
    });
  }
  if (stu.stateIndex >= 6) {
    const acc = (stu.attempts || []).find(a => a.status === "accepted");
    push({ st: 6, label: `Proposal accepted${acc && acc.n > 1 ? ` on attempt #${acc.n}` : ""}`, actor: aSup || aFac, ts: acc ? acc.ts : dt(1, 10, 11, 0), email: "prop-accepted" });
  }
  if (stu.stateIndex >= 7) {
    push({ st: 7, focus: true, label: `Supervisor assigned — ${sup ? sup.name : "—"}`, actor: aHod, ts: dt(2, 4, 10, 0), email: "sup-assigned", supervisorName: sup ? sup.full : "" });
    push({ st: 7, focus: true, label: "Supervision started", actor: aSup, ts: dt(2, 6, 9, 0), email: "sup-notified" });
    
    const meetings = meetingsFor(stu);
    meetings.forEach(m => {
      if (m.confirmed) push({ st: 7, focus: true, label: `Meeting confirmed for ${fmt(m.ts)} ${fmtT(m.ts)}`, actor: aSup, ts: m.setTs });
      if (m.logged) push({ st: 7, focus: true, label: `Meeting logged — ${m.topic}`, actor: aSup, ts: m.ts, meeting: m });
    });
  }
  if (stu.stateIndex >= 8) push({ st: 8, label: "Book signed off & submitted for pre-defense", actor: aSup, ts: dt(5, 22, 12, 0), email: "reached-predefense", note: "Supervisor sign-off — advances to Pre-Defense (forward-only)" });
  if (stu.stateIndex >= 9) {
    const ex = supervisorsMap[stu.examinerPreId || ""];
    push({ st: 9, label: `Pre-defense examiner assigned — ${ex ? ex.name : "—"}`, actor: aFac, ts: dt(6, 1, 10, 0), email: "examiner-assigned", forward: true });
    if (stu.predefenseStatus && stu.stateIndex > 9) push({ st: 9, label: "Pre-defense completed — cleared to defend", actor: aExt2(ex), ts: dt(6, 4, 15, 0) });
  }
  if (stu.stateIndex >= 10) {
    const ex = supervisorsMap[stu.examinerDefId || ""];
    push({ st: 10, label: `Defense outcome recorded — ${stu.defense ? stu.defense.outcome : "—"}`, actor: aExt2(ex), ts: stu.defense ? stu.defense.ts : dt(6, 7, 11, 0), email: "defense-result", terminal: true });
  }
  return ev.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

export const NOTIF_LOG: NotificationLog[] = [
  { id: "N-2041", template: "sup-assigned",  to: "keza.ihirwe@stu.aauca.ac.rw",  toName: "Keza Ihirwe",  toRole: "Student",   ts: dt(2, 4, 10, 2),  status: "sent",    studentId: "STU-2026-014" },
  { id: "N-2042", template: "sup-notified",  to: "jd.habimana@aauca.ac.rw",       toName: "Dr. Habimana", toRole: "Supervisor",ts: dt(2, 4, 10, 2),  status: "sent",    studentId: "STU-2026-014" },
  { id: "N-2055", template: "prop-rejected", to: "eric.mugisha@stu.aauca.ac.rw",  toName: "Mugisha Eric", toRole: "Student",   ts: dt(12, 2, 9, 16), status: "sent",    studentId: "STU-2026-021" },
  { id: "N-2061", template: "prop-rejected", to: "eric.mugisha@stu.aauca.ac.rw",  toName: "Mugisha Eric", toRole: "Student",   ts: dt(12, 16, 10, 1),status: "failed",  studentId: "STU-2026-021", error: "SMTP 451 — greylisted by mailbox provider" },
  { id: "N-2061r",template: "prop-rejected", to: "eric.mugisha@stu.aauca.ac.rw",  toName: "Mugisha Eric", toRole: "Student",   ts: dt(12, 16, 10, 9),status: "retried", studentId: "STU-2026-021", note: "Auto-retry #2 succeeded after 8 min" },
  { id: "N-2070", template: "prop-accepted", to: "eric.mugisha@stu.aauca.ac.rw",  toName: "Mugisha Eric", toRole: "Student",   ts: dt(1, 8, 11, 31), status: "sent",    studentId: "STU-2026-021" },
  { id: "N-2088", template: "examiner-assigned", to: "jd.habimana@aauca.ac.rw",   toName: "Dr. Habimana", toRole: "Examiner",  ts: dt(6, 1, 10, 1),  status: "sent",    studentId: "STU-2026-003" },
  { id: "N-2089", template: "reached-predefense", to: "patrick.niyonsaba@stu.aauca.ac.rw", toName: "Niyonsaba Patrick", toRole: "Student", ts: dt(5, 22, 12, 2), status: "sent", studentId: "STU-2026-003" },
  { id: "N-2090", template: "proto-granted", to: "diane.uwase@stu.aauca.ac.rw",   toName: "Uwase Diane",  toRole: "Student",   ts: dt(11, 18, 16, 2),status: "sent",    studentId: "STU-2026-008" },
  { id: "N-2091", template: "proto-refine",  to: "diane.uwase@stu.aauca.ac.rw",   toName: "Uwase Diane",  toRole: "Student",   ts: dt(11, 16, 14, 4),status: "sent",    studentId: "STU-2026-008" },
  { id: "N-2092", template: "case-approved", to: "keza.ihirwe@stu.aauca.ac.rw",   toName: "Keza Ihirwe",  toRole: "Student",   ts: dt(10, 24, 15, 6),status: "sent",    studentId: "STU-2026-014" },
];

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: "A-9001", actor: HOD.name,         role: "HOD",        action: "Uploaded registered-student list (40 records)", ts: dt(10, 2, 9, 0),  ip: "196.12.4.21" },
  { id: "A-9002", actor: HOD.name,         role: "HOD",        action: "Approved case letter — STU-2026-014",            ts: dt(10, 24, 15, 5),ip: "196.12.4.21" },
  { id: "A-9015", actor: HOD.name,         role: "HOD",        action: "Assigned supervisor Dr. Habimana → STU-2026-014",ts: dt(2, 4, 10, 0),  ip: "196.12.4.21" },
  { id: "A-9023", actor: "Dr. Habimana",   role: "Supervisor", action: "Logged meeting (Absent) — STU-2026-014",          ts: dt(3, 27, 14, 30),ip: "41.74.10.9"  },
  { id: "A-9031", actor: FACILITATOR.name, role: "Facilitator",action: "Assigned pre-defense examiner Dr. Habimana → STU-2026-003", ts: dt(6, 1, 10, 0), ip: "196.12.4.55" },
  { id: "A-9040", actor: SUPERADMIN.name,  role: "Superadmin", action: "Reset password — Keza Ihirwe (STU-2026-014)",     ts: dt(6, 9, 8, 12),  ip: "10.0.0.2"    },
  { id: "A-9041", actor: SUPERADMIN.name,  role: "Superadmin", action: "Viewed notification log",                          ts: dt(6, 9, 8, 14),  ip: "10.0.0.2"    },
  { id: "A-9042", actor: "Dr. Habimana",   role: "Supervisor", action: "Signed off book — STU-2026-003",                  ts: dt(5, 22, 12, 0), ip: "41.74.10.9"  },
];

export const PENDING: PendingCoordinationItem[] = [
  { id: "p1", kind: "assign-examiner",   label: "Pre-defense examiner not assigned", student: "STU-2026-031", detail: "At Book Submitted 6 days — needs examiner", age: "6 days", sev: "high" },
  { id: "p2", kind: "assign-examiner",   label: "Defense examiner not assigned", student: "STU-2026-003", detail: "Pre-defense cleared — assign defense panel", age: "2 days", sev: "high" },
  { id: "p3", kind: "email",             label: "‘Reached pre-defense’ email not sent", student: "STU-2026-019", detail: "Book signed off but notification pending", age: "1 day", sev: "med" },
  { id: "p4", kind: "assign-supervisor", label: "Supervisor not assigned", student: "STU-2026-027", detail: "Proposal accepted 4 days ago", age: "4 days", sev: "med" },
  { id: "p5", kind: "stalled",           label: "Stalled in Proposal Under Review", student: "STU-2026-021", detail: "2 rejections — 11 days since resubmission", age: "11 days", sev: "low" },
];

export const TEMPLATES: { [key: string]: { event: string; subject: string; hero?: boolean } } = {
  "reg-confirmed":     { event: "Registration confirmed",        subject: "You've been registered for FYP — Class of 2026" },
  "case-requested":    { event: "Case-study letter requested",   subject: "Action needed: submit your case-study letter", hero: true },
  "case-approved":     { event: "Case letter approved",          subject: "Your case-study letter has been approved" },
  "proto-refine":      { event: "Prototype needs refinement",    subject: "Prototype review: refinement required" },
  "proto-granted":     { event: "Prototype granted",             subject: "Prototype granted — proceed to proposal" },
  "prop-rejected":     { event: "Proposal rejected (with reason)",subject: "Proposal returned for revision" },
  "prop-accepted":     { event: "Proposal accepted",             subject: "Your proposal has been accepted" },
  "sup-assigned":      { event: "Supervisor assigned",           subject: "Your FYP supervisor has been assigned", hero: true },
  "sup-notified":      { event: "Supervisor notified of students",subject: "New students assigned to you for supervision" },
  "examiner-assigned": { event: "Assigned to conduct a pre-defense", subject: "You have been assigned as a pre-defense examiner", hero: true },
  "reached-predefense":{ event: "Reached pre-defense",           subject: "Book signed off — pre-defense stage" },
  "defense-result":    { event: "Defense scheduled / result",    subject: "Defense outcome recorded" },
};

export function semesters(students: Student[]): SemesterInfo[] {
  const m: { [key: string]: SemesterInfo } = {};
  students.forEach(s => {
    const i = semesterOf(s.bookRegisteredTs);
    m[i.key] = i;
  });
  return Object.values(m).sort((a, b) => b.order - a.order);
}

