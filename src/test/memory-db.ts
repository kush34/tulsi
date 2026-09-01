import { vi } from "vitest";
import { Prisma, Role } from "@prisma/client";

export type Session = { user: { id: string; role: Role } };

export const sessionState: { value: Session | null } = { value: null };

const PROFILE_FIELDS = [
  "allergies",
  "conditions",
  "medications",
  "surgeries",
  "familyHistory",
  "socialHistory",
] as const;

export type ProfileRow = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
} & Record<(typeof PROFILE_FIELDS)[number], unknown>;

const users = new Map<string, { id: string; role: Role }>();
const profiles = new Map<string, ProfileRow>();
const changes: {
  id: string;
  profileId: string;
  changedBy: string;
  changes: unknown;
  ip?: string;
  createdAt: Date;
}[] = [];
let profileSeq = 0;
let changeSeq = 0;

function unwrap(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === Prisma.JsonNull) return null;
  return value;
}

function pick(data: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of PROFILE_FIELDS) row[field] = unwrap(data[field]);
  return row;
}

function mergeRow(existing: ProfileRow, data: Record<string, unknown>): ProfileRow {
  const row: ProfileRow = { ...existing };
  for (const field of PROFILE_FIELDS) {
    if (data[field] !== undefined) row[field] = unwrap(data[field]);
  }
  row.updatedAt = new Date();
  return row;
}

export const memoryDb = {
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => users.get(where.id) ?? null),
  },
  medicalProfile: {
    findUnique: vi.fn(async ({ where }: { where: { userId: string } }) => {
      const row = profiles.get(where.userId);
      return row ? { ...row } : null;
    }),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { userId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = profiles.get(where.userId);
        if (existing) {
          const merged = mergeRow(existing, update);
          profiles.set(where.userId, merged);
          return { ...merged };
        }
        const row: ProfileRow = {
          id: `profile-${++profileSeq}`,
          userId: where.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(pick(create) as Record<(typeof PROFILE_FIELDS)[number], unknown>),
        };
        profiles.set(where.userId, row);
        return { ...row };
      }
    ),
  },
  medicalProfileChange: {
    create: vi.fn(
      async ({
        data,
      }: {
        data: {
          profileId: string;
          changedBy: string;
          changes: unknown;
          ip?: string;
        };
      }) => {
        const row = {
          id: `chg-${++changeSeq}`,
          profileId: data.profileId,
          changedBy: data.changedBy,
          changes: data.changes,
          ip: data.ip,
          createdAt: new Date(),
        };
        changes.push(row);
        return { ...row };
      }
    ),
    findMany: vi.fn(
      async ({
        where,
        orderBy,
        take,
      }: {
        where: { profileId: string };
        orderBy?: { createdAt: "desc" };
        take?: number;
      }) => {
        const filtered = changes.filter((c) => c.profileId === where.profileId);
        if (orderBy?.createdAt === "desc") {
          filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return filtered.slice(0, take ?? filtered.length).map((c) => ({ ...c }));
      }
    ),
  },
};

export function resetMemoryDb(): void {
  users.clear();
  profiles.clear();
  changes.length = 0;
  profileSeq = 0;
  changeSeq = 0;
  historySessions.clear();
  historyQuestions.clear();
  historyAnswers.clear();
  historyFacts.clear();
  historyFlags.clear();
  clinicalHistories.clear();
  sessionState.value = null;
  const mocks = [
    memoryDb.user.findUnique,
    memoryDb.medicalProfile.findUnique,
    memoryDb.medicalProfile.upsert,
    memoryDb.medicalProfileChange.create,
    memoryDb.medicalProfileChange.findMany,
    memoryDbHistory.$transaction,
    memoryDbHistory.historySession.create,
    memoryDbHistory.historySession.update,
    memoryDbHistory.historySession.findUnique,
    memoryDbHistory.historySession.findFirst,
    memoryDbHistory.historySession.findMany,
    memoryDbHistory.historySession.count,
    memoryDbHistory.historyQuestion.create,
    memoryDbHistory.historyQuestion.findFirst,
    memoryDbHistory.historyQuestion.findMany,
    memoryDbHistory.historyAnswer.create,
    memoryDbHistory.historyAnswer.update,
    memoryDbHistory.historyAnswer.findFirst,
    memoryDbHistory.historyAnswer.findMany,
    memoryDbHistory.historyFact.create,
    memoryDbHistory.historyFact.update,
    memoryDbHistory.historyFact.updateMany,
    memoryDbHistory.historyFact.findFirst,
    memoryDbHistory.historyFact.findMany,
    memoryDbHistory.historyFlag.create,
    memoryDbHistory.historyFlag.findFirst,
    memoryDbHistory.historyFlag.findMany,
    memoryDbHistory.clinicalHistory.findUnique,
    memoryDbHistory.clinicalHistory.upsert,
    memoryDbHistory.historySession.findMany,
    memoryDbHistory.historySession.update,
  ];
  for (const mock of mocks) {
    if (mock) mock.mockClear();
  }
}

export function seedUser(user: { id: string; role: Role }): void {
  users.set(user.id, user);
}

export function seedProfile(userId: string, data: Partial<Record<(typeof PROFILE_FIELDS)[number], unknown>>): void {
  profiles.set(userId, {
    id: `profile-${userId}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...pick(data as Record<string, unknown>),
  } as ProfileRow);
}

export function getProfile(userId: string): ProfileRow | undefined {
  return profiles.get(userId);
}

export function getChanges(): typeof changes {
  return changes;
}

export async function setSession(session: Session | null): Promise<void> {
  sessionState.value = session;
}

type Row = Record<string, unknown>;

function cuid(seq: number): string {
  return `c${String(seq).padStart(24, "0")}`;
}

function isIn(value: unknown): boolean {
  return typeof value === "object" && value !== null && "in" in value;
}

function matches(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(where)) {
    const actual = row[key];
    if (isIn(expected)) {
      if (!(expected as { in: unknown[] }).in.includes(actual)) return false;
    } else if (!Object.is(actual, expected)) {
      return false;
    }
  }
  return true;
}

function orderRows(rows: Row[], orderBy?: { createdAt?: "asc" | "desc"; sequence?: "asc" | "desc" }): Row[] {
  if (!orderBy) return [...rows];
  const key = orderBy.sequence !== undefined ? "sequence" : "createdAt";
  const dir = orderBy.sequence ?? orderBy.createdAt;
  return [...rows].sort((a, b) => {
    const av = a[key] as number | Date;
    const bv = b[key] as number | Date;
    const diff = (av instanceof Date ? av.getTime() : av) - (bv instanceof Date ? bv.getTime() : bv);
    return dir === "desc" ? -diff : diff;
  });
}

function applySelect(row: Row, select: Record<string, unknown>, extra: Record<string, unknown> = {}): Row {
  if (!select) return row;
  const out: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(select)) {
    if (key === "_count") {
      const counts: Record<string, number> = {};
      const sub = (spec as Record<string, unknown>).select as Record<string, unknown>;
      for (const rel of Object.keys(sub)) {
        counts[rel] = (extra[rel] as unknown[] | undefined)?.length ?? 0;
      }
      out[key] = counts;
      continue;
    }
    out[key] = (extra[key] as Row | undefined) ?? row[key];
  }
  return out;
}

function makeHistoryQueries(table: Map<string, Row>, relations: Record<string, Map<string, Row>> = {}) {
  const seq = { value: 1 };
  const join = (row: Row, spec: unknown): Row => {
    if (typeof spec !== "object" || spec === null) return row;
    const select = (spec as { select?: Record<string, unknown> }).select;
    if (!select) return row;
    const out: Row = {};
    for (const [key, subSpec] of Object.entries(select)) {
      if (key === "question" && typeof subSpec === "object" && subSpec !== null) {
        const rel = relations.question?.get(row.questionId as string);
        out[key] = rel ? join(rel, subSpec) : null;
      } else if (typeof subSpec === "boolean") {
        out[key] = row[key];
      }
    }
    return out;
  };
  return {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const id = cuid(seq.value++);
      const row: Row = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
      table.set(id, row);
      return { ...row };
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const existing = table.get(where.id);
      if (!existing) throw new Error("record not found");
      const row: Row = { ...existing, ...data, updatedAt: new Date() };
      table.set(where.id, row);
      return { ...row };
    }),
    findUnique: vi.fn(async ({ where }: { where: Record<string, string> }) => {
      if (typeof where.id === "string") {
        const row = table.get(where.id);
        return row ? { ...row } : null;
      }
      const row = [...table.values()].find((r) => matches(r, where));
      return row ? { ...row } : null;
    }),
    updateMany: vi.fn(
      async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        const rows = [...table.values()].filter((r) => matches(r, where ?? {}));
        for (const row of rows) {
          const merged: Row = { ...row, ...data, updatedAt: new Date() };
          table.set(row.id as string, merged);
        }
        return { count: rows.length };
      }
    ),
    findFirst: vi.fn(async ({ where, select }: { where: Record<string, unknown>; select?: Record<string, unknown> }) => {
      const row = [...table.values()].find((r) => matches(r, where));
      if (!row) return null;
      return select ? { ...join(row, { select }) } : { ...row };
    }),
    findMany: vi.fn(
      async ({
        where,
        orderBy,
        take,
        skip,
        select,
      }: {
        where?: Record<string, unknown>;
        orderBy?: { createdAt?: "asc" | "desc"; sequence?: "asc" | "desc" };
        take?: number;
        skip?: number;
        select?: Record<string, unknown>;
      }) => {
        const rows = orderRows([...table.values()].filter((r) => matches(r, where ?? {})), orderBy);
        const sliced = rows.slice(skip ?? 0, (skip ?? 0) + (take ?? rows.length));
        return sliced.map((r) => {
          let row: Row = { ...r };
          if (select?.question) row = join(row, { select });
          if (select?._count) {
            row = applySelect(row, select, {
              answers: [...(relations.answer?.values() ?? [])].filter((a) => a.sessionId === r.id),
              facts: [...(relations.fact?.values() ?? [])].filter((f) => f.sessionId === r.id),
              flags: [...(relations.flag?.values() ?? [])].filter((f) => f.sessionId === r.id),
            });
          }
          return row;
        });
      }
    ),
    count: vi.fn(async ({ where }: { where?: Record<string, unknown> }) =>
      [...table.values()].filter((r) => matches(r, where ?? {})).length
    ),
  };
}

const historySessions = new Map<string, Row>();
const historyQuestions = new Map<string, Row>();
const historyAnswers = new Map<string, Row>();
const historyFacts = new Map<string, Row>();
const historyFlags = new Map<string, Row>();
const clinicalHistories = new Map<string, Row>();

export const memoryDbHistory = {
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  historySession: makeHistoryQueries(historySessions, {
    answer: historyAnswers,
    fact: historyFacts,
    flag: historyFlags,
  }),
  historyQuestion: makeHistoryQueries(historyQuestions),
  historyAnswer: makeHistoryQueries(historyAnswers, { question: historyQuestions }),
  historyFact: makeHistoryQueries(historyFacts),
  historyFlag: makeHistoryQueries(historyFlags),
  clinicalHistory: {
    ...makeHistoryQueries(clinicalHistories),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { sessionId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = [...clinicalHistories.values()].find((r) => r.sessionId === where.sessionId);
        if (existing) {
          const merged: Row = { ...existing, ...update, updatedAt: new Date() };
          clinicalHistories.set(existing.id as string, merged);
          return { ...merged };
        }
        const row: Row = {
          id: cuid(clinicalHistories.size + 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          sessionId: where.sessionId,
          ...create,
        };
        clinicalHistories.set(row.id as string, row);
        return { ...row };
      }
    ),
  },
  auditEvent: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const row: Row = { id: `ae-${Math.random().toString(36).slice(2)}`, createdAt: new Date(), ...data };
      clinicalHistories.set(row.id as string, row);
      return { ...row };
    }),
  },
};

export type HistorySessionRow = Row & { id: string; patientId: string; status: string };

export function seedHistorySession(overrides: Partial<Row> = {}): HistorySessionRow {
  const seq = Math.max(...[...historySessions.keys()].map((k) => Number(k.replace(/^c0+/, "")) || 0), historySessions.size) + 1;
  const row: Row = {
    id: cuid(seq),
    patientId: "u1",
    status: "IN_PROGRESS",
    framework: "MODERN",
    currentSection: "CHIEF_COMPLAINT",
    currentQuestionId: null,
    appointmentId: null,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  historySessions.set(row.id as string, row);
  return { ...row } as HistorySessionRow;
}

export function seedHistoryQuestion(overrides: Partial<Row> = {}): Row {
  const seq = historyQuestions.size + 1;
  const row: Row = {
    id: cuid(100000 + seq),
    sessionId: "",
    section: "CHIEF_COMPLAINT",
    question: "Please describe your main health concern.",
    questionType: "OPEN_ENDED",
    sequence: seq,
    createdAt: new Date(),
    ...overrides,
  };
  historyQuestions.set(row.id as string, row);
  return { ...row };
}

export function seedHistoryFact(overrides: Partial<Row> = {}): Row {
  const seq = historyFacts.size + 1;
  const row: Row = {
    id: cuid(110000 + seq),
    sessionId: "",
    section: "CHIEF_COMPLAINT",
    field: "complaint",
    value: "fever",
    source: "AI_EXTRACTION",
    verification: "UNVERIFIED",
    createdAt: new Date(),
    ...overrides,
  };
  historyFacts.set(row.id as string, row);
  return { ...row };
}

export function seedHistoryFlag(overrides: Partial<Row> = {}): Row {
  const seq = historyFlags.size + 1;
  const row: Row = {
    id: cuid(120000 + seq),
    sessionId: "",
    type: "RED_FLAG",
    severity: "HIGH",
    status: "OPEN",
    description: "Flagged for review",
    detectedAt: new Date(),
    resolvedAt: null,
    ...overrides,
  };
  historyFlags.set(row.id as string, row);
  return { ...row };
}

export function getHistorySessions(): HistorySessionRow[] {
  return [...historySessions.values()] as HistorySessionRow[];
}

export function getHistoryFacts(): Row[] {
  return [...historyFacts.values()];
}

export function getHistoryFlags(): Row[] {
  return [...historyFlags.values()];
}