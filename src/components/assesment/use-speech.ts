"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i8n/config";

export type SpeechPhase = "idle" | "listening" | "speaking";

const LANG_MAP: Partial<Record<Locale, string>> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  gu: "gu-IN",
  ur: "ur-PK",
  kn: "kn-IN",
  ml: "ml-IN",
  or: "or-IN",
  pa: "pa-IN",
  as: "as-IN",
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

const MAX_AUTO_RESUMES = 5;

function createRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, (new () => Recognition) | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(locale: Locale) {
  const lang = LANG_MAP[locale] ?? "en-IN";
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [supported] = useState(() => ({
    stt: createRecognition() !== null,
    tts: typeof window !== "undefined" && "speechSynthesis" in window,
  }));
  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onEndRef = useRef<((finalTranscript: string) => void) | undefined>(undefined);
  const activeRef = useRef(false);
  const resumesRef = useRef(0);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      recognitionRef.current?.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const finishListening = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current = null;
    setPhase("idle");
    const done = onEndRef.current;
    onEndRef.current = undefined;
    done?.(finalRef.current.trim());
  }, []);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current = null;
      setPhase("idle");
    }
  }, []);

  const startListening = useCallback(
    (onEnd?: (finalTranscript: string) => void) => {
      const Ctor = createRecognition();
      if (!Ctor) return;
      window.speechSynthesis?.cancel();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      finalRef.current = "";
      resumesRef.current = 0;
      setTranscript("");
      setMicError(null);
      activeRef.current = true;
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      onEndRef.current = onEnd;
      recognition.onresult = (event) => {
        resumesRef.current = 0;
        let interim = "";
        for (const result of Array.from(event.results)) {
          if (result.isFinal) finalRef.current += result[0].transcript;
          else interim += result[0].transcript;
        }
        setTranscript((finalRef.current + " " + interim).trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          activeRef.current = false;
          setMicError("denied");
        }
      };
      recognition.onend = () => {
        if (!activeRef.current) {
          finishListening();
          return;
        }
        if (resumesRef.current >= MAX_AUTO_RESUMES) {
          finishListening();
          return;
        }
        resumesRef.current += 1;
        window.setTimeout(() => {
          if (!activeRef.current) return;
          try {
            recognition.start();
          } catch {
            finishListening();
          }
        }, 150);
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        finishListening();
        return;
      }
      setPhase("listening");
    },
    [lang, finishListening],
  );

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      stopListening();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
      if (voice) utterance.voice = voice;
      utterance.onend = () => setPhase((p) => (p === "speaking" ? "idle" : p));
      setPhase("speaking");
      window.speechSynthesis.speak(utterance);
    },
    [lang, stopListening],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPhase((p) => (p === "speaking" ? "idle" : p));
  }, []);

  return { phase, transcript, micError, supported, startListening, stopListening, speak, stopSpeaking };
}
