import { db } from "@/db";
import { getSessionForActor } from "./session-state";
import type { Actor } from "./session-state";

export interface TranscriptEntry {
  sequence: number;
  questionId: string;
  question: string;
  section: string;
  questionType: string;
  answer: string | null;
  inputType: string | null;
  answeredAt: Date | null;
}

export async function getSessionTranscript(sessionId: string, actor: Actor) {
  await getSessionForActor(sessionId, actor);

  const [questions, answers] = await Promise.all([
    db.historyQuestion.findMany({
      where: { sessionId },
      orderBy: { sequence: "asc" },
      select: { id: true, question: true, section: true, questionType: true, sequence: true },
    }),
    db.historyAnswer.findMany({
      where: { sessionId },
      select: { questionId: true, rawAnswer: true, inputType: true, createdAt: true },
    }),
  ]);

  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const entries: TranscriptEntry[] = questions.map((q) => {
    const answer = byQuestion.get(q.id);
    return {
      sequence: q.sequence,
      questionId: q.id,
      question: q.question,
      section: q.section,
      questionType: q.questionType,
      answer: answer?.rawAnswer ?? null,
      inputType: answer ? String(answer.inputType) : null,
      answeredAt: answer?.createdAt ?? null,
    };
  });

  return { sessionId, entries };
}
