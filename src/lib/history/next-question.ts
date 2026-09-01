import { createLogger } from "@/lib/logging";
import type { AIProvider } from "@/lib/ai/provider";
import type { HistoryFramework } from "./sections";
import { getSection, getNextSection } from "./sections";

const log = createLogger("history-next-question");

export interface NextQuestionContext {
  section: string;
  framework: HistoryFramework;
  askedCount: number;
  factsSummary: string;
  missingInfo: string[];
  recentAnswers: { question: string; answer: string }[];
}

export interface NextQuestionResult {
  question: string | null;
  sectionComplete: boolean;
  movedToSection: string | null;
}

async function askAI(provider: AIProvider, ctx: NextQuestionContext): Promise<{
  question: string | null;
  sectionComplete: boolean;
}> {
  try {
    const suggestion = await provider.generateQuestion({
      section: ctx.section,
      sectionLabel: getSection(ctx.section)?.label ?? ctx.section,
      factsSummary: ctx.factsSummary,
      missingInfo: ctx.missingInfo,
      recentAnswers: ctx.recentAnswers,
    });
    return {
      question: suggestion.question || null,
      sectionComplete: suggestion.sectionComplete,
    };
  } catch (error) {
    log.warn({ err: error, section: ctx.section }, "AI question generation failed, using fallback");
    return { question: null, sectionComplete: false };
  }
}

function askFallback(ctx: NextQuestionContext): { question: string | null; sectionComplete: boolean } {
  const section = getSection(ctx.section);
  if (!section) return { question: null, sectionComplete: true };
  if (ctx.askedCount < section.fallbackQuestions.length) {
    return { question: section.fallbackQuestions[ctx.askedCount], sectionComplete: false };
  }
  return { question: null, sectionComplete: true };
}

export async function chooseNextQuestion(
  provider: AIProvider | null,
  ctx: NextQuestionContext
): Promise<NextQuestionResult> {
  let choice: { question: string | null; sectionComplete: boolean };
  if (provider) {
    const ai = await askAI(provider, ctx);
    choice = ai.question === null ? askFallback(ctx) : ai;
  } else {
    choice = askFallback(ctx);
  }

  const finished = choice.sectionComplete || choice.question === null;
  if (finished) {
    const next = getNextSection(ctx.section, ctx.framework);
    if (next) {
      return {
        question: next.fallbackQuestions[0] ?? null,
        sectionComplete: false,
        movedToSection: next.id,
      };
    }
    return { question: null, sectionComplete: true, movedToSection: null };
  }

  return { question: choice.question, sectionComplete: false, movedToSection: null };
}