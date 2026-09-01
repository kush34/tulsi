# M08 — History Review & Verification

Adds the patient review → doctor review → finalize lifecycle on top of the AI-assisted history sessions (M07).

## Lifecycle

```
IN_PROGRESS ⇄ PAUSED → PATIENT_REVIEW → DOCTOR_REVIEW → COMPLETED (locked)
                                          └→ CANCELLED
```

- `DOCTOR_REVIEW` added to `HistorySessionStatus` (migration `20260901142539_add_doctor_review_status`).
- Locking is `COMPLETED` + `completedAt`: every mutating operation rejects a completed session, so finalized histories are immutable.
- Answering is still only allowed while `IN_PROGRESS`/`PAUSED`.

## Verification model

Two orthogonal signals on each `HistoryFact`:

- **Provenance** — `source` (`AI_EXTRACTION` | `PATIENT` | `DOCTOR`).
- **Confidence** — `verification` (`UNVERIFIED` → `PATIENT_CONFIRMED` → `DOCTOR_VERIFIED`) plus `verifiedById`/`verifiedAt`.

| Action | source | verification |
|---|---|---|
| Patient adds/edits a fact (TOR 4/5) | `PATIENT` | `PATIENT_CONFIRMED` |
| Patient confirms whole history (TOR 6) | unchanged | all `UNVERIFIED` → `PATIENT_CONFIRMED` |
| Doctor edits a fact (TOR 8) | `DOCTOR` | `DOCTOR_VERIFIED` |
| Doctor verifies a fact (TOR 9) | unchanged | `DOCTOR_VERIFIED` |

This lets the UI highlight three states (TOR 10): AI-drafted-unverified, confirmed-by-patient, verified-by-doctor.

## Snapshot

`ClinicalHistory.sections` now uses one canonical shape with provenance per entry:

```
{ [section]: [{ field, value, source, verification }] }
```

`HistoryFact` remains the source of truth; every mutation re-materialises the snapshot (`materializeSnapshot`/`refreshSnapshot`), regenerating the summary and preserving `isVerified`. `finalize` sets `isVerified = true`.

## API

### Patient (requires PATIENT; own session)
| Method | Path | Purpose | TOR |
|---|---|---|---|
| GET | `/sessions/:id/review` | structured generated history (sections + provenance + flags + missing fields) | 2, 3 |
| POST | `/sessions/:id/review/confirm` | confirm history, enter `DOCTOR_REVIEW` | 6 |
| POST | `/sessions/:id/facts` | add a missing fact | 5 |
| PATCH | `/sessions/:id/facts/:factId` | edit a generated fact | 4 |

Patient edits only allowed during `PATIENT_REVIEW`. Fields are validated against the section's `allowedFields`; adding an existing `(section, field)` conflicts.

### Doctor (requires DOCTOR or ADMIN; any patient's session)
| Method | Path | Purpose | TOR |
|---|---|---|---|
| GET | `/sessions?status=DOCTOR_REVIEW` | list sessions awaiting doctor review | 7 |
| GET | `/sessions/:id/doctor/review` | review payload incl. per-section `missing` and flags | 7, 11 |
| PATCH | `/sessions/:id/facts/:factId` | correct AI/patient content | 8 |
| POST | `/sessions/:id/facts/:factId/verify` | mark a fact `DOCTOR_VERIFIED` | 9 |
| POST | `/sessions/:id/flags/:flagId/resolve` or `/dismiss` | action open flags (`resolution`, `resolvedById/At`) | 11 |
| POST | `/sessions/:id/finalize` | lock history as `COMPLETED`, `isVerified=true` | 12 |

Doctor actions only allowed during `DOCTOR_REVIEW`.

## Config

No new configuration. AI summary regeneration falls back to the deterministic digest when no provider is configured.

## Testing

`src/test/lib/history/review-flow.test.ts` covers fact add/edit provenance, confirm counting, status-gated mutations, staff-only actions, flag resolution, finalize + lock enforcement, review payload (provenance, missing fields), ownership, and doctor status-filtered listing. Route tests in `src/test/app/api/v1/history/sessions/review-routes.test.ts` cover authz (401/403/409) and happy paths. `src/test/memory-db.ts` gained `historyFact.updateMany` and `seedHistoryFlag`.

Run: `npm run typecheck && npm run lint && npm test && npm run build` (128 tests).

## Notes
- Patient confirmation does not doctor-verify facts; TOR 9 remains a per-fact doctor action.
- Edit history is recorded through audit events (`HISTORY.FACT_ADDED/EDITED/VERIFIED`, `HISTORY.FLAG_RESOLVED/DISMISSED`, `HISTORY.HISTORY_CONFIRMED/FINALIZED`), not a new table.