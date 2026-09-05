import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({
  app: { url: "http://localhost:3000", name: "tulsi" },
  ai: {
    provider: "none",
    chatBaseUrl: "",
    chatModel: "",
    timeoutMs: 5000,
    openaiKey: "",
    anthropicKey: "",
    openrouter: { apiKey: "", model: "", baseUrl: "https://openrouter.ai/api/v1" },
    ollama: { baseUrl: "http://localhost:11434/v1", model: "" },
  },
}));

vi.mock("@/lib/config", () => ({ config: mockConfig }));

import { aiConfigured } from "@/lib/ai/provider";
import { createAIProvider } from "@/lib/ai/provider/openai-compatible";

function stubFetch() {
  return vi.fn(async () =>
    Response.json({
      choices: [
        { message: { content: '{"nextQuestion":"What brings you in today?","sectionComplete":false}' } },
      ],
    }),
  );
}

function resetAi() {
  mockConfig.ai.provider = "none";
  mockConfig.ai.chatModel = "";
  mockConfig.ai.openaiKey = "";
  mockConfig.ai.openrouter.apiKey = "";
  mockConfig.ai.openrouter.model = "";
  mockConfig.ai.ollama.model = "";
}

describe("ai provider resolution", () => {
  beforeEach(() => {
    resetAi();
    vi.unstubAllGlobals();
  });

  it("stays disabled with provider none", () => {
    expect(aiConfigured()).toBe(false);
    expect(createAIProvider()).toBeNull();
  });

  it("requires an OpenRouter key and model", () => {
    mockConfig.ai.provider = "openrouter";
    expect(aiConfigured()).toBe(false);
    mockConfig.ai.openrouter.model = "meta-llama/llama-3.3-70b-instruct:free";
    expect(aiConfigured()).toBe(false);
    mockConfig.ai.openrouter.apiKey = "sk-or-test";
    expect(aiConfigured()).toBe(true);
    expect(createAIProvider()).not.toBeNull();
  });

  it("posts to OpenRouter with bearer key and referer headers", async () => {
    mockConfig.ai.provider = "openrouter";
    mockConfig.ai.openrouter.apiKey = "sk-or-test";
    mockConfig.ai.openrouter.model = "meta-llama/llama-3.3-70b-instruct:free";
    const fetchMock = stubFetch();
    vi.stubGlobal("fetch", fetchMock);

    const provider = createAIProvider();
    const suggestion = await provider!.generateQuestion({
      section: "CHIEF_COMPLAINT",
      sectionLabel: "Chief complaint",
      factsSummary: "",
      missingInfo: [],
      recentAnswers: [],
    });

    expect(suggestion.question).toBe("What brings you in today?");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer sk-or-test");
    expect(headers["HTTP-Referer"]).toBe("http://localhost:3000");
    expect(JSON.parse(init.body as string).model).toBe("meta-llama/llama-3.3-70b-instruct:free");
    expect(JSON.parse(init.body as string).max_tokens).toBe(4000);
  });

  it("runs Ollama locally with a model and no key", async () => {
    mockConfig.ai.provider = "ollama";
    mockConfig.ai.ollama.model = "llama3.1:8b";
    expect(aiConfigured()).toBe(true);

    const fetchMock = stubFetch();
    vi.stubGlobal("fetch", fetchMock);
    const provider = createAIProvider();
    await provider!.generateQuestion({
      section: "CHIEF_COMPLAINT",
      sectionLabel: "Chief complaint",
      factsSummary: "",
      missingInfo: [],
      recentAnswers: [],
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
    expect(JSON.parse(init.body as string).model).toBe("llama3.1:8b");
    expect(JSON.parse(init.body as string).max_tokens).toBe(4000);
  });

  it("keeps generic openai-compatible behavior", () => {
    mockConfig.ai.provider = "openai-compatible";
    mockConfig.ai.chatModel = "custom-model";
    expect(aiConfigured()).toBe(true);
    expect(createAIProvider()).not.toBeNull();
  });
});
