import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import {
  resetMemoryDb,
  seedUser,
  memoryDbHistory,
  seedHistorySession,
  seedHistoryFact,
  seedHistoryFlag,
  getHistoryFacts,
  getHistoryFlags,
  getHistorySessions,
} from "@/test/memory-db";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";

vi.mock("@/db", async () => {
  const { memoryDb, memoryDbHistory } = await import("@/test/memory-db");
  return { db: { ...memoryDb, ...memoryDbHistory } };
});
vi.mock("@/lib/auth/notifications", () => ({ recordAuditEvent: vi.fn() }));
vi.mock("@/lib/ai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai")>("@/lib/ai");
  return { ...actual, createAIProvider: vi.fn(() => null) };
});

import {
  addFact,
  editFact,
  verifyFact,
  setFlagStatus,
  confirmHistory,
  finalizeHistory,
  getReviewHistory,
  getClinicalSummary,
  listHistorySessions,
} from "@/lib/history";

const patient = { id: "u1", role: Role.PATIENT };
const doctor = { id: "d1", role: Role.DOCTOR };
const admin = { id: "a1", role: Role.ADMIN };

describe("history review flow", () => {
  beforeEach(() => resetMemoryDb());

  describe("patient review edits", () => {
    it("lets a patient add a missing fact during PATIENT_REVIEW and refresh the snapshot", async () => {
      seedUser({ id: "u1", role: Role.PATIENT });
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      seedHistoryFact({ sessionId: session.id, section: "HPI", field: "onset", value: "sudden" });

      const fact = await addFact(patient, session.id, {
        section: "HPI",
        field: "duration",
        value: "two days",
      });
      expect(fact.source).toBe("PATIENT");
      expect(fact.verification).toBe("PATIENT_CONFIRMED");
      expect(fact.verifiedById).toBe("u1");
      expect(getHistoryFacts()).toHaveLength(2);

      const snapshot = await getClinicalSummary(session.id, patient);
      expect((snapshot.sections as Record<string, { field: string }[]>).HPI).toContainEqual(
        expect.objectContaining({ field: "duration", value: "two days", source: "PATIENT", verification: "PATIENT_CONFIRMED" })
      );
    });

    it("lets a patient edit an existing fact with patient provenance", async () => {
      seedUser({ id: "u1", role: Role.PATIENT });
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      const fact = seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "three days" });

      const updated = await editFact(patient, session.id, fact.id as string, "five days");
      expect(updated.value).toEqual({ text: "five days" });
      expect(updated.source).toBe("PATIENT");
      expect(updated.verification).toBe("PATIENT_CONFIRMED");
    });

    it("rejects patient edits while IN_PROGRESS, DOCTOR_REVIEW or COMPLETED", async () => {
      for (const status of ["IN_PROGRESS", "DOCTOR_REVIEW", "COMPLETED"]) {
        const session = seedHistorySession({ status: status as string, patientId: "u1" });
        await expect(
          addFact(patient, session.id, { section: "CHIEF_COMPLAINT", field: "complaint", value: "cough" })
        ).rejects.toThrow(ConflictError);
      }
    });

    it("rejects a field that is not allowed in the section", async () => {
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      await expect(
        addFact(patient, session.id, { section: "CHIEF_COMPLAINT", field: "diagnosis", value: "x" })
      ).rejects.toThrow(ConflictError);
      await expect(
        addFact(patient, session.id, { section: "UNKNOWN_SECTION", field: "complaint", value: "x" })
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects adding a fact that already exists", async () => {
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "one day" });
      await expect(
        addFact(patient, session.id, { section: "HPI", field: "duration", value: "two days" })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("patient confirmation", () => {
    it("confirms every unverified fact and moves the session to DOCTOR_REVIEW", async () => {
      seedUser({ id: "u1", role: Role.PATIENT });
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      seedHistoryFact({ sessionId: session.id, section: "CHIEF_COMPLAINT", field: "complaint", value: "cough", verification: "UNVERIFIED" });
      seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "two days", verification: "UNVERIFIED" });
      seedHistoryFact({ sessionId: session.id, section: "ALLERGY_HISTORY", field: "hasAllergies", value: "none", verification: "PATIENT_CONFIRMED", verifiedById: "u1" });

      const result = await confirmHistory(patient, session.id);
      expect(result.confirmedFacts).toBe(2);
      expect(result.session.status).toBe("DOCTOR_REVIEW");
      expect(getHistorySessions()[0].status).toBe("DOCTOR_REVIEW");
      const facts = getHistoryFacts();
      expect(facts.filter((f) => f.verification === "PATIENT_CONFIRMED")).toHaveLength(3);
      expect(facts.every((f) => f.verifiedById === "u1")).toBe(true);
    });

    it("only the owning patient can confirm, and only from PATIENT_REVIEW", async () => {
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u2" });
      await expect(confirmHistory(patient, session.id)).rejects.toThrow(ForbiddenError);

      const own = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      await expect(confirmHistory(patient, own.id)).rejects.toThrow(ConflictError);
    });
  });

  describe("doctor review actions", () => {
    it("lets a doctor edit facts during DOCTOR_REVIEW", async () => {
      seedUser({ id: "d1", role: Role.DOCTOR });
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      const fact = seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "two days" });

      const updated = await editFact(doctor, session.id, fact.id as string, "three days");
      expect(updated.source).toBe("DOCTOR");
      expect(updated.verification).toBe("DOCTOR_VERIFIED");
      expect(updated.verifiedById).toBe("d1");
    });

    it("blocks doctor edits before the patient confirms", async () => {
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      const fact = seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "two days" });
      await expect(editFact(doctor, session.id, fact.id as string, "x")).rejects.toThrow(ConflictError);
    });

    it("lets a doctor verify a fact, keeping its original source", async () => {
      seedUser({ id: "d1", role: Role.DOCTOR });
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      const fact = seedHistoryFact({ sessionId: session.id, section: "HPI", field: "duration", value: "two days", source: "AI_EXTRACTION", verification: "PATIENT_CONFIRMED" });

      const verified = await verifyFact(doctor, session.id, fact.id as string);
      expect(verified.verification).toBe("DOCTOR_VERIFIED");
      expect(verified.source).toBe("AI_EXTRACTION");
      expect(verified.verifiedById).toBe("d1");
    });

    it("rejects verify and flag actions by a patient", async () => {
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      const fact = seedHistoryFact({ sessionId: session.id, field: "complaint", value: "cough" });
      const flag = seedHistoryFlag({ sessionId: session.id });
      await expect(verifyFact(patient, session.id, fact.id as string)).rejects.toThrow(ForbiddenError);
      await expect(setFlagStatus(patient, session.id, flag.id as string, "RESOLVED")).rejects.toThrow(ForbiddenError);
    });

    it("resolves and dismisses open flags for a doctor", async () => {
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      const resolved = seedHistoryFlag({ sessionId: session.id, type: "CONTRADICTION", description: "conflicting durations" });
      const dismissed = seedHistoryFlag({ sessionId: session.id, type: "RED_FLAG" });

      const r = await setFlagStatus(doctor, session.id, resolved.id as string, "RESOLVED", "patient clarified");
      expect(r.status).toBe("RESOLVED");
      expect(r.resolution).toBe("patient clarified");
      expect(r.resolvedById).toBe("d1");

      const d = await setFlagStatus(admin, session.id, dismissed.id as string, "DISMISSED");
      expect(d.status).toBe("DISMISSED");

      await expect(setFlagStatus(doctor, session.id, resolved.id as string, "DISMISSED")).rejects.toThrow(ConflictError);
      await expect(setFlagStatus(doctor, session.id, "missing", "RESOLVED")).rejects.toThrow(NotFoundError);
      expect(getHistoryFlags()).toHaveLength(2);
    });
  });

  describe("finalization", () => {
    it("locks the session as COMPLETED and marks the snapshot verified", async () => {
      seedUser({ id: "d1", role: Role.DOCTOR });
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      seedHistoryFact({ sessionId: session.id, field: "complaint", value: "cough" });

      const result = await finalizeHistory(doctor, session.id);
      expect(result.session.status).toBe("COMPLETED");
      expect(result.session.completedAt).toBeInstanceOf(Date);
      expect(result.snapshot.isVerified).toBe(true);

      const snapshot = await getClinicalSummary(session.id, patient);
      expect(snapshot.isVerified).toBe(true);
    });

    it("rejects finalization except from DOCTOR_REVIEW, and prevents a patient from finalizing", async () => {
      const session = seedHistorySession({ status: "PATIENT_REVIEW", patientId: "u1" });
      await expect(finalizeHistory(doctor, session.id)).rejects.toThrow(ConflictError);
      await expect(finalizeHistory(patient, session.id)).rejects.toThrow(ForbiddenError);
    });

    it("blocks every mutation once finalized", async () => {
      const session = seedHistorySession({ status: "COMPLETED", patientId: "u1", completedAt: new Date() });
      const fact = seedHistoryFact({ sessionId: session.id, field: "complaint", value: "cough" });
      const flag = seedHistoryFlag({ sessionId: session.id });

      await expect(addFact(patient, session.id, { section: "HPI", field: "duration", value: "x" })).rejects.toThrow(ConflictError);
      await expect(editFact(patient, session.id, fact.id as string, "x")).rejects.toThrow(ConflictError);
      await expect(verifyFact(doctor, session.id, fact.id as string)).rejects.toThrow(ConflictError);
      await expect(setFlagStatus(doctor, session.id, flag.id as string, "RESOLVED")).rejects.toThrow(ConflictError);
      await expect(confirmHistory(patient, session.id)).rejects.toThrow(ConflictError);
      await expect(finalizeHistory(doctor, session.id)).rejects.toThrow(ConflictError);
    });
  });

  describe("review history payload", () => {
    it("returns sections with provenance, missing fields and flags", async () => {
      seedUser({ id: "u1", role: Role.PATIENT });
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      seedHistoryFact({ sessionId: session.id, section: "CHIEF_COMPLAINT", field: "complaint", value: "fever", verification: "PATIENT_CONFIRMED" });
      seedHistoryFact({ sessionId: session.id, section: "HPI", field: "onset", value: "sudden", source: "AI_EXTRACTION", verification: "UNVERIFIED" });
      const red = seedHistoryFlag({ sessionId: session.id, type: "RED_FLAG", description: "fever + rash requires review" });
      await memoryDbHistory.clinicalHistory.upsert({
        where: { sessionId: session.id },
        create: { sessionId: session.id, sections: {}, summary: "draft summary", isVerified: false },
        update: { sections: {}, summary: "draft summary", isVerified: false },
      });

      const history = await getReviewHistory(session.id, patient);
      expect(history.sessionId).toBe(session.id);
      expect(history.status).toBe("DOCTOR_REVIEW");
      expect(history.sections.CHIEF_COMPLAINT.facts[0]).toMatchObject({
        field: "complaint",
        value: "fever",
        source: "AI_EXTRACTION",
        verification: "PATIENT_CONFIRMED",
      });
      expect(history.sections.HPI.missing).toEqual(["duration", "severity"]);
      expect(history.redFlags.map((f) => f.id)).toEqual([red.id]);
      expect(history.summary).toBe("draft summary");
    });

    it("enforces ownership for patients but grants doctors access", async () => {
      const session = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u2" });
      await expect(getReviewHistory(session.id, patient)).rejects.toThrow(ForbiddenError);
      const doctorView = await getReviewHistory(session.id, doctor);
      expect(doctorView.sessionId).toBe(session.id);
      await expect(getReviewHistory("nonexistent", doctor)).rejects.toThrow(NotFoundError);
    });
  });

  describe("session listing", () => {
    it("lists own sessions for a patient and filters by status for a doctor", async () => {
      const mine = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u1" });
      const other = seedHistorySession({ status: "DOCTOR_REVIEW", patientId: "u2" });
      seedHistorySession({ status: "COMPLETED", patientId: "u2" });

      const patientList = await listHistorySessions(patient, 1, 20);
      expect(patientList.data.map((s) => s.id)).toEqual([mine.id]);

      const doctorPending = await listHistorySessions(doctor, 1, 20, "DOCTOR_REVIEW");
      expect(doctorPending.data.map((s) => s.id).sort()).toEqual([mine.id, other.id].sort());

      const doctorAll = await listHistorySessions(doctor, 1, 20);
      expect(doctorAll.meta.total).toBe(3);
    });
  });
});