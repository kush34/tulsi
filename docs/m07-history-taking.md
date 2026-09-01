# M07 — AI-Assisted History Taking

An interactive, clinician-verifiable history-taking flow. A patient answers one question at a
time; an AI model (when configured) proposes the next question and extracts structured facts.
Deterministic rule engines validate every fact, and nothing AI produces is trusted until a human
confirms it.

## Design principles

- **AI proposes, rules dispose, humans decide.** AI output is treated as untrusted input.
- **No diagnosis, no prescription — ever.** The extraction layer blocks clinical decision content
  at the schema boundary and at the safety layer; both must be wired before any other capability.
- **Raw answers are always preserved.** Structured facts are a derived view, linked back to the
  answer that produced them (`sourceReference`).
- **Fully deterministic fallback.** With no model configured the module still works end-to-end
  (template questions, raw answers only, digest summary).
- **Alert, don't diagnose.** Red-flag rules produce alert states (`POTENTIAL_EMERGENCY`,
  `CONCERN`) with escalation hints and an explicit "this is not a diagnosis" statement.

## Data model (Prisma)

- `HistorySession` — one active session per patient; `status`, `framework`
  (`MODERN` | `AYUSH`), `currentSection`, `currentQuestionId`.
- `HistoryQuestion` — a question asked during a session (section + sequence).
- `HistoryAnswer` — `rawAnswer` (always kept), optional `normalizedAnswer` (extracted facts JSON),
  `inputType` (`TEXT` | `VOICE` | `TOUCH` | `OTHER`).
- `HistoryFact` — structured fact: `section`, `field`, `value` (JSON), `source`
  (`AI_EXTRACTION`), `verification` (`UNVERIFIED` until a human acts), `sourceReference` (the
  originating answer id). Facts are upserted per `(sessionId, section, field)`.
- `HistoryFlag` — `RED_FLAG` or `CONTRADICTION`, `severity`, `status` (`OPEN` until handled).
  Deduplicated by `ruleId`; does not auto-resolve.
- `ClinicalHistory` — the reviewable snapshot: `sections` JSON + `summary`, `isVerified=false`
  until a doctor/patient confirms (future module).

## Session state machine

```
NOT_STARTED ─► IN_PROGRESS ─► PAUSED ─► IN_PROGRESS
                  │  │  └──► PATIENT_REVIEW ─► COMPLETED / CANCELLED
                  │  └──────► CANCELLED
```

Answers are accepted only while `IN_PROGRESS` or `PAUSED`. `assertTransition` in
`src/lib/history/state.ts` is the single source of truth.

## AI boundary (`src/lib/ai/`)

- `provider.ts` — `AIProvider` interface + `aiConfigured()`; `createAIProvider()` currently
  returns `null` when no provider is configured (fully deterministic mode).
- `provider/openai-compatible.ts` — OpenAI-compatible chat-completions impl over global `fetch`.
- `schemas.ts` — zod schemas. `clinicalExtractionSchema` **rejects** fact fields that carry
  clinical decision content (`diagnosis`, `prescription`, `treatment`, ...).
- `safety.ts` — `applyExtractionSafety`: if the model proposes a diagnosis/prescription, the
  whole structured output is rejected (violation audited as `HISTORY.AI_SAFETY_VIOLATION`) and
  the raw answer is kept. Fields outside the section allowlist are silently dropped.
- `prompts/` — system prompt (safety constraints) + section/question/summary prompt builders.
- `json.ts` — tolerant JSON extraction from model output (markdown fences, leading text).

## Rule engines (`src/lib/history/rules/`)

- `red-flags.ts` — deterministic keyword rules (`STROKE_LIKE`, `CHEST_PAIN_EMERGENCY`,
  `ANAPHYLAXIS_LIKE`, `BREATHING_DIFFICULTY`) over signal fields
  (`complaint`, `associatedSymptoms`, `symptom`, `character`, `location`, `radiation`).
  Rejected facts are ignored. Alerts are state, not diagnoses.
- `contradictions.ts` — `VALUE_REVERSAL`, `MEDICATION_CONFLICT`, `ALLERGY_CONFLICT` using
  negation/affirmation detection.
- `missing-info.ts` — required-field gaps per section.

## Orchestration (`src/lib/history/`)

- `session-service.ts` — create/pause/resume/review/summary/list/draft.
- `answers.ts` — answer pipeline: persist raw answer → (optional) AI extraction + safety gates →
  upsert facts → contradiction + red-flag detection (deduped) → next question → full payload.
- `next-question.ts` — AI next question with deterministic fallback; advances sections via
  `sections.ts` ordering (AYUSH sections appended for the `AYUSH` framework).

## API

Base: `/api/v1/history/sessions`

| Method | Path                               | Access   | Purpose                          |
| ------ | ---------------------------------- | -------- | -------------------------------- |
| POST   | `/sessions`                        | patient  | Start a session (409 if active)  |
| GET    | `/sessions`                        | patient  | List own sessions (paged)        |
| GET    | `/sessions/[sessionId]`            | auth     | Full session state/payload       |
| POST   | `/sessions/[sessionId]/answers`    | patient  | Submit an answer                 |
| POST   | `/sessions/[sessionId]/pause`      | patient  | Pause                            |
| POST   | `/sessions/[sessionId]/resume`     | patient  | Resume                           |
| POST   | `/sessions/[sessionId]/complete`   | patient  | Request patient review (snapshot)|
| GET    | `/sessions/[sessionId]/history`    | auth     | Draft grouped by section         |
| GET    | `/sessions/[sessionId]/summary`    | auth     | Generated clinical summary       |

Authorization: patients access only their own sessions (`getSessionForActor`); doctors/admins
may read any session. All state changes are audited (`HISTORY.SESSION_STARTED`, `HISTORY.ANSWER_SUBMITTED`,
`HISTORY.RED_FLAG`, `HISTORY.AI_SAFETY_VIOLATION`, `HISTORY.SNAPSHOT_GENERATED`, ...).

## Configuration

`.env` (all optional):

```
AI_PROVIDER=none                # none | openai-compatible
AI_CHAT_BASE_URL=http://localhost:11434/v1
AI_CHAT_MODEL=
AI_TIMEOUT_MS=15000
```

If `AI_CHAT_MODEL` is empty, the module runs fully deterministically.

## Testing

`src/test/` covers: state machine transitions, red-flag/contradiction/missing-info rules,
schema + safety-layer rejection of clinical content, deterministic and AI-provider session flows,
and route authz/validation (using the shared in-memory DB in `src/test/memory-db.ts`).

## Future work (not in this module)

- Patient confirmation / doctor verification of the snapshot → `isVerified=true`.
- Full AYUSH questionnaire (the config extension point exists).
- Voice (`TOUCH`/`VOICE`) input support.