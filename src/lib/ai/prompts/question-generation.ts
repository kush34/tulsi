export function buildQuestionUserPrompt(input: {
  sectionLabel: string;
  factsSummary: string;
  missingInfo: string[];
  recentAnswers: { question: string; answer: string }[];
}): string {
  return `You are guiding a history-taking conversation. Decide the next useful question for this section.

Section: ${input.sectionLabel}
Information already collected:
${input.factsSummary || "(none yet)"}

Known missing details:
${input.missingInfo.length ? input.missingInfo.map((f) => `- ${f}`).join("\n") : "(none)"}

Recent exchange:
${input.recentAnswers.length
    ? input.recentAnswers
        .map((r) => `Patient: ${r.answer}`)
        .join("\n")
    : "(none)"}

Ask ONE concise, patient-friendly follow-up question that fills a missing detail. Do not repeat questions already answered. If enough information has been collected for this section, respond with sectionComplete true and an empty nextQuestion.

Respond with JSON only:
{
  "nextQuestion": "<question text or empty>",
  "sectionComplete": false
}`;
}