export type HistoryFramework = "MODERN" | "AYUSH";

export interface HistorySection {
  id: string;
  label: string;
  allowedFields: string[];
  requiredFields: string[];
  fallbackQuestions: string[];
  frameworks: HistoryFramework[];
}

export const MODERN_SECTIONS: HistorySection[] = [
  {
    id: "CHIEF_COMPLAINT",
    label: "Chief Complaint",
    allowedFields: ["complaint", "location", "duration", "onset", "severity", "progress"],
    requiredFields: ["complaint"],
    fallbackQuestions: ["Please describe your main health concern in your own words."],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "HPI",
    label: "History of Present Illness",
    allowedFields: [
      "onset",
      "duration",
      "location",
      "character",
      "radiation",
      "severity",
      "aggravatingFactors",
      "relievingFactors",
      "associatedSymptoms",
      "progress",
    ],
    requiredFields: ["duration", "severity"],
    fallbackQuestions: [
      "Tell me more about the problem — when did it start, where exactly, and how severe is it?",
      "What makes it better or worse?",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "PAST_MEDICAL",
    label: "Past Medical History",
    allowedFields: ["condition", "diagnosedAt", "status"],
    requiredFields: [],
    fallbackQuestions: [
      "Do you have any long-term or past medical conditions such as diabetes, hypertension, asthma, or heart disease?",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "PAST_SURGICAL",
    label: "Past Surgical History",
    allowedFields: ["surgery", "year", "hospital"],
    requiredFields: [],
    fallbackQuestions: ["Have you had any surgeries in the past, and if so when and where?"],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "DRUG_HISTORY",
    label: "Drug History",
    allowedFields: ["medication", "dosage", "frequency", "takingMedications", "lastTook"],
    requiredFields: ["takingMedications"],
    fallbackQuestions: [
      "Do you currently take any medicines, including over-the-counter or herbal remedies?",
      "Please list them and how often you take them.",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "ALLERGY_HISTORY",
    label: "Allergy History",
    allowedFields: ["allergen", "reaction", "severity", "hasAllergies"],
    requiredFields: ["hasAllergies"],
    fallbackQuestions: [
      "Do you have any allergies to medicines, foods, or anything else?",
      "What reaction do you get?",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "FAMILY_HISTORY",
    label: "Family History",
    allowedFields: ["relative", "condition"],
    requiredFields: [],
    fallbackQuestions: ["Do any close family members have significant medical conditions?"],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "PERSONAL_SOCIAL",
    label: "Personal/Social History",
    allowedFields: ["smoking", "alcohol", "diet", "exercise", "occupation", "livingSituation"],
    requiredFields: [],
    fallbackQuestions: [
      "Do you smoke, use tobacco, or drink alcohol?",
      "What do you do for work and how is your diet and exercise routine?",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "REVIEW_OF_SYSTEMS",
    label: "Review of Systems",
    allowedFields: ["symptom", "system", "present"],
    requiredFields: [],
    fallbackQuestions: ["Do you have any other symptoms in any other part of your body?"],
    frameworks: ["MODERN", "AYUSH"],
  },
  {
    id: "PREVIOUS_INVESTIGATIONS",
    label: "Previous Investigations",
    allowedFields: ["investigation", "finding", "date"],
    requiredFields: [],
    fallbackQuestions: [
      "Have you had any recent tests such as blood work, ECG, X-ray, or scans?",
    ],
    frameworks: ["MODERN", "AYUSH"],
  },
];

export const AYUSH_SECTIONS: HistorySection[] = [
  {
    id: "AYURVEDIC_CONSTITUTION",
    label: "Ayurvedic Constitution",
    allowedFields: [
      "prakriti",
      "vikriti",
      "sara",
      "samhanana",
      "pramana",
      "satmya",
      "sattva",
      "aharaShakti",
      "vyayamaShakti",
      "vaya",
      "ahara",
      "vihara",
      "agni",
      "koshtha",
      "nidana",
      "samprapti",
    ],
    requiredFields: [],
    fallbackQuestions: [
      "Describe your typical daily diet and digestion (appetite, regularity, bowel pattern).",
      "Describe your sleep, exercise, and overall personal constitution.",
    ],
    frameworks: ["AYUSH"],
  },
];

export const HISTORY_SECTIONS: HistorySection[] = [...MODERN_SECTIONS, ...AYUSH_SECTIONS];

export const SECTION_ORDER = MODERN_SECTIONS.map((s) => s.id);

export function getSection(id: string): HistorySection | undefined {
  return HISTORY_SECTIONS.find((s) => s.id === id);
}

export function getSectionOrder(framework: HistoryFramework): string[] {
  const modern = SECTION_ORDER;
  if (framework === "AYUSH") {
    return [...modern, ...AYUSH_SECTIONS.map((s) => s.id)];
  }
  return modern;
}

export function getNextSection(currentId: string, framework: HistoryFramework): HistorySection | undefined {
  const order = getSectionOrder(framework);
  const index = order.indexOf(currentId);
  if (index < 0 || index + 1 >= order.length) return undefined;
  return getSection(order[index + 1]);
}