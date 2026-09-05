"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i8n/config";
import { getDictionary } from "@/i8n/dictionaries";
import AssessmentShell from "./assessment-shell";
import AssessmentModeChip from "./assessment-mode-chip";
import AssessmentOrb from "./assessment-orb";
import AssessmentAnswerForm from "./assessment-answer-form";
import AssessmentTranscript from "./assessment-transcript";
import { DoneScreen, ErrorScreen, LoadingScreen } from "./assessment-status-screens";
import { getAiStatus } from "./assessment-api";
import type { AiStatus } from "./assessment-api";
import { useAssessmentSession } from "./use-assessment-session";
import { useSpeech } from "./use-speech";

function humanizeSection(section: string): string {
  return section
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function AssessmentQuestion({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { assessment } = dictionary;
  const { status, payload, entries, error, answer, finish, restart } = useAssessmentSession(locale);
  const { phase, transcript, micError, supported, startListening, stopListening, speak, stopSpeaking } =
    useSpeech(locale);

  const [input, setInput] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [restartArmed, setRestartArmed] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const lastSpokenRef = useRef<string | null>(null);
  const lastSpeechRef = useRef("");
  const autoVoiceRef = useRef(true);
  const autoSentRef = useRef("");
  const prevPhaseRef = useRef(phase);

  const listening = phase === "listening";
  const speaking = phase === "speaking";
  const busy = status === "submitting" || status === "completing";
  const current = payload?.currentQuestion ?? null;
  const currentId = current?.id;

  const commitSpeech = useCallback((final: string) => {
    if (!final) return;
    lastSpeechRef.current = final;
    setInput((prev) => prev || final);
  }, []);

  const sendVoiceAnswer = useCallback(
    (text: string) => {
      autoSentRef.current = text;
      stopListening();
      void answer(text, "VOICE").then((next) => {
        if (next) {
          setInput("");
          setRestartArmed(false);
          lastSpeechRef.current = "";
        }
      });
    },
    [answer, stopListening],
  );

  useEffect(() => {
    let cancelled = false;
    getAiStatus()
      .then((s) => {
        if (!cancelled) setAiStatus(s);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    autoVoiceRef.current = true;
    autoSentRef.current = "";
  }, [currentId]);

  useEffect(() => {
    if (current && soundOn && supported.tts && lastSpokenRef.current !== current.id) {
      lastSpokenRef.current = current.id;
      speak(current.question);
    }
  }, [current, soundOn, supported.tts, speak]);

  useEffect(() => {
    if (!current || status !== "ready" || busy || !supported.stt) return;
    if (!autoVoiceRef.current) return;
    if (supported.tts && soundOn) return;
    autoVoiceRef.current = false;
    startListening(commitSpeech);
  }, [current, status, busy, supported.stt, supported.tts, soundOn, startListening, commitSpeech]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (
      prev === "speaking" &&
      phase === "idle" &&
      autoVoiceRef.current &&
      current &&
      status === "ready" &&
      !busy &&
      supported.stt
    ) {
      autoVoiceRef.current = false;
      startListening(commitSpeech);
    }
  }, [phase, current, status, busy, supported.stt, startListening, commitSpeech]);

  useEffect(() => {
    if (phase !== "listening" || status !== "ready" || busy || !current) return;
    const text = transcript.trim();
    if (!text || text === autoSentRef.current) return;
    if (input && input !== text) return;
    const timer = window.setTimeout(() => sendVoiceAnswer(text), 2500);
    return () => window.clearTimeout(timer);
  }, [transcript, phase, status, busy, current, input, sendVoiceAnswer]);

  function handleOrbTap() {
    autoVoiceRef.current = false;
    if (listening) {
      stopListening();
    } else if (speaking) {
      stopSpeaking();
      startListening(commitSpeech);
    } else if (supported.stt && current && status === "ready" && !busy) {
      startListening(commitSpeech);
    }
  }

  function handleSound() {
    if (soundOn) stopSpeaking();
    setSoundOn((v) => !v);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const kind = lastSpeechRef.current && text === lastSpeechRef.current.trim() ? "VOICE" : "TEXT";
    void answer(text, kind).then((next) => {
      if (next) {
        setInput("");
        setRestartArmed(false);
        lastSpeechRef.current = "";
      }
    });
  }

  function handleRestart() {
    if (busy) return;
    if (!restartArmed) {
      setRestartArmed(true);
      return;
    }
    setRestartArmed(false);
    stopListening();
    stopSpeaking();
    setInput("");
    lastSpokenRef.current = null;
    lastSpeechRef.current = "";
    setReviewSubmitted(false);
    void restart();
  }

  if (status === "loading") {
    return (
      <AssessmentShell
        locale={locale}
        heading="…"
        progressPct={5}
        chip={<AssessmentModeChip status={aiStatus} fallbackLabel={assessment.live.aiFallback} />}
      >
        <LoadingScreen label={assessment.voice.listening} />
      </AssessmentShell>
    );
  }

  if (status === "error" || !payload) {
    return (
      <AssessmentShell
        locale={locale}
        heading="…"
        progressPct={5}
        chip={<AssessmentModeChip status={aiStatus} fallbackLabel={assessment.live.aiFallback} />}
      >
        <ErrorScreen
          title={assessment.live.retry}
          body={error || assessment.live.loadError}
          actionLabel={assessment.live.retry}
          onAction={() => window.location.reload()}
        />
      </AssessmentShell>
    );
  }

  const answerCount = payload.answerCount;
  const progressPct = status === "done" ? 100 : Math.min(10 + answerCount * 9, 95);
  const heading = `${assessment.live.sectionLabel}: ${humanizeSection(payload.session.currentSection)} · Q${answerCount + 1}`;
  const hasRedFlags = payload.flags.redFlags.length > 0;

  if (!current) {
    return (
      <AssessmentShell
        locale={locale}
        heading={heading}
        progressPct={progressPct}
        chip={<AssessmentModeChip status={aiStatus} fallbackLabel={assessment.live.aiFallback} />}
      >
        <AssessmentTranscript entries={entries} />
        {reviewSubmitted ? (
          <DoneScreen
            title={assessment.live.reviewReady}
            body={assessment.preliminaryNotice}
            actionLabel={assessment.live.reviewCta}
            actionHref={`/${locale}/document`}
          />
        ) : (
          <DoneScreen
            title={assessment.live.reviewReady}
            body={assessment.preliminaryNotice}
            actionLabel={status === "completing" ? assessment.live.finishing : assessment.live.finish}
            onAction={() => {
              setReviewSubmitted(true);
              void finish().catch(() => setReviewSubmitted(false));
            }}
          />
        )}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleRestart}
            disabled={busy}
            className="text-[12px] font-medium text-[#64748b] hover:text-[#1768d5] disabled:opacity-50"
          >
            {busy
              ? assessment.live.restarting
              : restartArmed
                ? assessment.live.restartConfirm
                : assessment.live.restart}
          </button>
        </div>
      </AssessmentShell>
    );
  }

  return (
    <AssessmentShell
      locale={locale}
      heading={heading}
      progressPct={progressPct}
      voiceState={phase}
      chip={<AssessmentModeChip status={aiStatus} fallbackLabel={assessment.live.aiFallback} />}
    >
      {hasRedFlags && (
        <p className="mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-800">
          {assessment.live.redFlag}
        </p>
      )}

      <AssessmentTranscript entries={entries} />

      <div className="mb-7">
        <h1 className="text-[27px] font-semibold leading-[1.2] tracking-[-0.025em] text-[#172033] sm:text-[30px]">
          {current.question}
        </h1>
        <p className="mt-2 text-[13px] text-[#718096]">{assessment.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[140px_1fr]">
        <div className="flex flex-col gap-3">
          <AssessmentOrb
            phase={phase}
            disabled={!supported.stt || busy}
            label={listening ? assessment.live.tapToStop : assessment.voice.tapToSpeak}
            onTap={handleOrbTap}
          />
          <button
            type="button"
            onClick={handleSound}
            className="text-[11px] font-medium text-[#64748b] hover:text-[#1768d5]"
          >
            {soundOn ? assessment.live.soundOn : assessment.live.soundOff}
          </button>
        </div>
        <AssessmentAnswerForm
          liveTranscript={transcript}
          listening={listening}
          input={input}
          busy={busy}
          placeholder={assessment.live.typePlaceholder}
          sendLabel={assessment.live.send}
          sendingLabel={assessment.live.sending}
          hint={
            micError
              ? assessment.live.micBlocked
              : supported.stt
                ? assessment.voice.transcript
                : assessment.voice.chooseAnswer
          }
          onInput={setInput}
          onSend={handleSend}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[12px] text-red-600">{error || ""}</p>
        <button
          type="button"
          onClick={handleRestart}
          disabled={busy}
          className="shrink-0 text-[12px] font-medium text-[#64748b] hover:text-[#1768d5] disabled:opacity-50"
        >
          {busy
            ? assessment.live.restarting
            : restartArmed
              ? assessment.live.restartConfirm
              : assessment.live.restart}
        </button>
      </div>
    </AssessmentShell>
  );
}
