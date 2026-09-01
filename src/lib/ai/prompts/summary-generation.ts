export function buildSummaryUserPrompt(input: {
  sectionsText: string;
  redFlags: string[];
}): string {
  return `Write a structured, patient-friendly summary of the collected clinical history.

Sections collected:
${input.sectionsText || "(none)"}

Health flags for review:
${input.redFlags.length ? input.redFlags.join("\n") : "(none)"}

Rules:
- Base everything strictly on the collected information.
- Do not invent, diagnose, or prescribe.
- Use plain, understandable language and clearly mark the summary as an AI-generated DRAFT that has not been reviewed by a clinician.
- Mention which sections are incomplete, if any.

Respond with JSON only:
{
  "summary": "<the draft summary>"
}`;
}