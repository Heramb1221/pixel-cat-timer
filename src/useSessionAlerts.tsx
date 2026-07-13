import { useCallback, useEffect, useRef } from "react";

/**
 * Plays a short two-tone chime and (if permitted) shows a desktop
 * notification whenever a Pomodoro session finishes. No external audio
 * assets are needed — the chime is synthesized with the Web Audio API.
 */
export function useSessionAlerts(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        /* ignore — notifications are a nice-to-have, not required */
      });
    }
  }, [enabled]);

  const playChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const notes = [880, 1175]; // A5 -> D6, a friendly little "ding-dong"
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = freq;

        const startTime = ctx.currentTime + i * 0.16;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    } catch {
      /* audio isn't critical to app function — fail silently */
    }
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled) return;

      playChime();

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body, silent: true });
        } catch {
          /* some platforms restrict Notification from renderer contexts */
        }
      }
    },
    [enabled, playChime]
  );

  return { notify };
}
