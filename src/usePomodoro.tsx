import { useCallback, useEffect, useRef, useState } from "react";

export type Mode = "idle" | "focus" | "break";

interface Options {
  focusMinutes: number;
  breakMinutes: number;
  /** Automatically start the next session when one finishes. Defaults to true. */
  autoStartNext?: boolean;
  /** Called with the mode that just finished ("focus" | "break"), once per completed session. */
  onSessionEnd?: (finishedMode: Exclude<Mode, "idle">) => void;
}

export function usePomodoro({
  focusMinutes,
  breakMinutes,
  autoStartNext = true,
  onSessionEnd,
}: Options) {
  const [mode, setMode] = useState<Mode>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);

  const intervalRef = useRef<number | null>(null);

  const focusMinutesRef = useRef(focusMinutes);
  const breakMinutesRef = useRef(breakMinutes);
  const autoStartNextRef = useRef(autoStartNext);
  const onSessionEndRef = useRef(onSessionEnd);

  useEffect(() => {
    focusMinutesRef.current = focusMinutes;
  }, [focusMinutes]);

  useEffect(() => {
    breakMinutesRef.current = breakMinutes;
  }, [breakMinutes]);

  useEffect(() => {
    autoStartNextRef.current = autoStartNext;
  }, [autoStartNext]);

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  const startFocus = useCallback(() => {
    setMode("focus");
    setSecondsLeft(focusMinutesRef.current * 60);
    setIsPaused(false);
  }, []);

  const startBreak = useCallback(() => {
    setMode("break");
    setSecondsLeft(breakMinutesRef.current * 60);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setMode("idle");
    setSecondsLeft(0);
    setIsPaused(false);
  }, []);

  const start = useCallback(() => {
    setCompletedFocusSessions(0);
    startFocus();
  }, [startFocus]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const skip = useCallback(() => {
    setMode((currentMode) => {
      if (currentMode === "focus") {
        setCompletedFocusSessions((c) => c + 1);
        onSessionEndRef.current?.("focus");
        setSecondsLeft(breakMinutesRef.current * 60);
        setIsPaused(false);
        return "break";
      }
      if (currentMode === "break") {
        onSessionEndRef.current?.("break");
        setSecondsLeft(focusMinutesRef.current * 60);
        setIsPaused(false);
        return "focus";
      }
      return currentMode;
    });
  }, []);

  // Tick every second while a session is running and not paused.
  useEffect(() => {
    if (mode === "idle" || isPaused) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [mode, isPaused]);

  // Handle session completion / transition.
  useEffect(() => {
    if (mode === "idle" || secondsLeft > 0) return;

    if (mode === "focus") {
      setCompletedFocusSessions((c) => c + 1);
      onSessionEndRef.current?.("focus");
      if (autoStartNextRef.current) {
        startBreak();
      } else {
        stop();
      }
    } else if (mode === "break") {
      onSessionEndRef.current?.("break");
      if (autoStartNextRef.current) {
        startFocus();
      } else {
        stop();
      }
    }
  }, [secondsLeft, mode, startBreak, startFocus, stop]);

  return {
    mode,
    secondsLeft,
    isPaused,
    completedFocusSessions,
    start,
    stop,
    pause,
    resume,
    togglePause,
    skip,
  };
}
