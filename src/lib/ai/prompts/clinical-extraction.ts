export function buildExtractionUserPrompt(input: {
  sectionLabel: string;
  question: string;
  answer: string;
  allowedFields: string[];
}): string {
  return `Extract structured clinical facts from the patient's answer to the history-taking question.

Section: ${input.sectionLabel}
Question asked: ${input.question}
Patient answer: ${input.answer}

Only use fields that are relevant and allowed for this section. Allowed fields:
${input.allowedFields.join(", ")}

Extract only information the patient actually stated. Do not infer, diagnose, or invent missing values.

Respond with JSON only, in this exact shape:
{
  "facts": [
    { "field": "<one allowed field>", "value": "<exact patient wording, concise>", "confidence": 0.0 }
  ],
  "diagnosesProposed": [],
  "prescriptionsProposed": []
}

If the answer states the patient does NOT have something (e.g. "no allergies", "I do not take medicines"), include it as a fact with the negation ("hasAllergies": "no"). Keep "diagnosesProposed" and "prescriptionsProposed" empty unless the patient explicitly asks for or mentions a diagnosis or prescription — the system must detect and flag that.`;
}