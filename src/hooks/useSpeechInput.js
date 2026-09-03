import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech-to-text for the Chat composer. Wraps the Web Speech API
// (`SpeechRecognition` / `webkitSpeechRecognition`) — Chrome / Edge / Safari
// only, no Firefox, usually needs a network connection. The API manages its
// own microphone permission prompt, so this hook never touches getUserMedia.
//
// `continuous: false` means it stops on its own after a natural pause; a
// 15s hard cap catches the case where it doesn't.

const SR =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const MAX_LISTEN_MS = 15000;

export function useSpeechInput({ lang = "en", onFinal } = {}) {
  const supported = !!SR;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null); // "not-allowed" | "no-speech" | "network" | "audio-capture" | "unsupported" | "error"

  const recRef = useRef(null);
  const timeoutRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current);
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(() => {
    if (!SR) {
      setError("unsupported");
      return;
    }
    setError(null);
    setInterim("");
    // Read-aloud (SpeechSynthesis) and the mic can't both be live, or Rosie
    // transcribes her own voice.
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* no speechSynthesis */
    }

    const rec = new SR();
    rec.lang = lang === "es" ? "es-ES" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim());
        setInterim("");
      }
    };
    rec.onerror = (e) => setError(e.error || "error");
    rec.onend = () => {
      setListening(false);
      setInterim("");
      clearTimeout(timeoutRef.current);
      recRef.current = null;
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      timeoutRef.current = setTimeout(() => {
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      }, MAX_LISTEN_MS);
    } catch {
      setError("error");
      setListening(false);
      recRef.current = null;
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
      try {
        recRef.current?.abort();
      } catch {
        /* nothing running */
      }
    },
    []
  );

  return { supported, listening, interim, error, start, stop, toggle };
}
