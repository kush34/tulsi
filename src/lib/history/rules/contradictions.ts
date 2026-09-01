export interface ContradictionCandidate {
  ruleId: string;
  description: string;
  conflictingFields: string[];
}

export type FactMap = Map<string, string[]>;

const NEGATION_RE =
  /^(no|none|null|nil|false|denies|never|don'?t|do not|not taking|does not take|i don'?t|am not|n\/a)$/i;
const AFFIRMATION_RE =
  /^(yes|true|correct|i do|i take|present|am)$/i;

export function isNegation(value: string): boolean {
  return NEGATION_RE.test(value.trim().toLowerCase());
}

export function isAffirmation(value: string): boolean {
  return AFFIRMATION_RE.test(value.trim().toLowerCase());
}

function key(section: string, field: string): string {
  return `${section}:${field}`;
}

function isMeaningful(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) return false;
  if (isNegation(v) || isAffirmation(v)) return false;
  return true;
}

export function evaluateContradictions(
  newFacts: FactMap,
  existingFacts: FactMap
): ContradictionCandidate[] {
  const candidates: ContradictionCandidate[] = [];

  for (const [k, newVals] of newFacts) {
    const existingVals = existingFacts.get(k);
    if (existingVals && existingVals.length > 0) {
      const hadMeaningful = existingVals.some(isMeaningful);
      const nowNegated = newVals.some(isNegation);
      if (hadMeaningful && nowNegated) {
        candidates.push({
          ruleId: "VALUE_REVERSAL",
          description: `Earlier you said "${existingVals.join(", ")}" for ${k}, but now you indicated you do not have it.`,
          conflictingFields: [k],
        });
      }
    }
  }

  const medNegated = newFacts.get(key("DRUG_HISTORY", "takingMedications"))?.some(isNegation) === true;
  const existingMeds = existingFacts.get(key("DRUG_HISTORY", "medication"))?.some(isMeaningful) === true;
  const newMeds = newFacts.get(key("DRUG_HISTORY", "medication"))?.some(isMeaningful) === true;
  const medsNegatedEarlier =
    existingFacts.get(key("DRUG_HISTORY", "takingMedications"))?.some(isNegation) === true;
  if ((medNegated && existingMeds) || (medsNegatedEarlier && newMeds)) {
    candidates.push({
      ruleId: "MEDICATION_CONFLICT",
      description:
        "You mentioned not taking any medicines, but medication use was also recorded earlier. This needs clarification.",
      conflictingFields: ["DRUG_HISTORY:takingMedications", "DRUG_HISTORY:medication"],
    });
  }

  const allergyNegated =
    newFacts.get(key("ALLERGY_HISTORY", "hasAllergies"))?.some(isNegation) === true;
  const existingAllergens =
    existingFacts.get(key("ALLERGY_HISTORY", "allergen"))?.some(isMeaningful) === true;
  const allergensNow = newFacts.get(key("ALLERGY_HISTORY", "allergen"))?.some(isMeaningful) === true;
  const allergyNegatedEarlier =
    existingFacts.get(key("ALLERGY_HISTORY", "hasAllergies"))?.some(isNegation) === true;
  if ((allergyNegated && existingAllergens) || (allergyNegatedEarlier && allergensNow)) {
    candidates.push({
      ruleId: "ALLERGY_CONFLICT",
      description:
        "You indicated no allergies, but allergies were also recorded earlier. This needs clarification.",
      conflictingFields: ["ALLERGY_HISTORY:hasAllergies", "ALLERGY_HISTORY:allergen"],
    });
  }

  return candidates;
}