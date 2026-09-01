export { HISTORY_SECTIONS, SECTION_ORDER, getSection, getNextSection } from "./sections";
export type { HistorySection, HistoryFramework } from "./sections";
export { assertTransition, canTransition, isWritable } from "./state";
export {
  createHistorySession,
  pauseHistorySession,
  resumeHistorySession,
  requestPatientReview,
  getClinicalSummary,
  getDraftHistory,
  listHistorySessions,
  getHistorySessionPayload,
} from "./session-service";
export type { CreateSessionInput } from "./session-service";
export { answerHistorySession } from "./answers";
export type { AnswerInput } from "./answers";
export { getSessionForActor, assembleSessionPayload } from "./session-state";
export type { Actor, SessionPayload } from "./session-state";
export { evaluateRedFlags } from "./rules/red-flags";
export type { RedFlagCandidate } from "./rules/red-flags";
export { evaluateContradictions } from "./rules/contradictions";
export type { ContradictionCandidate } from "./rules/contradictions";
export { getMissingFields } from "./rules/missing-info";
export { addFact, editFact, verifyFact, setFlagStatus } from "./fact-ops";
export { confirmHistory, finalizeHistory, getReviewHistory } from "./review";
export { buildSectionsFromFacts, materializeSnapshot } from "./snapshot";