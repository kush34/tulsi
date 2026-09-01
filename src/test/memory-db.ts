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
  sessionState.value = null;
  const mocks = [
    memoryDb.user.findUnique,
    memoryDb.medicalProfile.findUnique,
    memoryDb.medicalProfile.upsert,
    memoryDb.medicalProfileChange.create,
    memoryDb.medicalProfileChange.findMany,
  ];
  for (const mock of mocks) {
    mock.mockClear();
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