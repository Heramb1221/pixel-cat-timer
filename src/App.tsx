import { useCallback, useEffect, useMemo, useState } from "react";
import { usePomodoro } from "./usePomodoro";
import { useCatAnimation } from "./useCatAnimation";
import { useSessionAlerts } from "./useSessionAlerts";

import idle from "./assets/idle.png";
import walk from "./assets/walk.png";
import stretch from "./assets/stretch.png";
import sleep from "./assets/sleep.png";
import wake from "./assets/wake.png";
import catFace from "./assets/cat-face.png";

const sprites: Record<string, string> = {
  idle,
  walk,
  stretch,
  sleep,
  wake,
};

const FOCUS_OPTIONS = [5, 15, 20, 25, 30, 45, 60];
const BREAK_OPTIONS = [5, 10, 15, 20];

const STORAGE_KEY = "pixel-cat-timer:settings";

interface StoredSettings {
  focus: number;
  breakTime: number;
  autoStartNext: boolean;
  soundEnabled: boolean;
}

function loadSettings(): StoredSettings {
  const defaults: StoredSettings = {
    focus: 25,
    breakTime: 5,
    autoStartNext: true,
    soundEnabled: true,
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    return {
      focus: FOCUS_OPTIONS.includes(parsed.focus) ? parsed.focus : defaults.focus,
      breakTime: BREAK_OPTIONS.includes(parsed.breakTime)
        ? parsed.breakTime
        : defaults.breakTime,
      autoStartNext:
        typeof parsed.autoStartNext === "boolean"
          ? parsed.autoStartNext
          : defaults.autoStartNext,
      soundEnabled:
        typeof parsed.soundEnabled === "boolean"
          ? parsed.soundEnabled
          : defaults.soundEnabled,
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const initialSettings = useMemo(loadSettings, []);

  const [focus, setFocus] = useState(initialSettings.focus);
  const [breakTime, setBreakTime] = useState(initialSettings.breakTime);
  const [autoStartNext, setAutoStartNext] = useState(
    initialSettings.autoStartNext
  );
  const [soundEnabled, setSoundEnabled] = useState(
    initialSettings.soundEnabled
  );

  // Persist settings whenever they change.
  useEffect(() => {
    const settings: StoredSettings = {
      focus,
      breakTime,
      autoStartNext,
      soundEnabled,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* localStorage may be unavailable (e.g. private mode) — non-fatal */
    }
  }, [focus, breakTime, autoStartNext, soundEnabled]);

  const { notify } = useSessionAlerts(soundEnabled);

  const handleSessionEnd = useCallback(
    (finishedMode: "focus" | "break") => {
      if (finishedMode === "focus") {
        notify("Focus session complete", "Time for a break. Good work!");
      } else {
        notify("Break's over", "Ready to focus again?");
      }
    },
    [notify]
  );

  const {
    mode,
    secondsLeft,
    isPaused,
    completedFocusSessions,
    start,
    stop,
    togglePause,
    skip,
  } = usePomodoro({
    focusMinutes: focus,
    breakMinutes: breakTime,
    autoStartNext,
    onSessionEnd: handleSessionEnd,
  });

  const { animation } = useCatAnimation(mode);

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalSeconds =
    (mode === "focus" ? focus : mode === "break" ? breakTime : 0) * 60;
  const progressPercent =
    totalSeconds > 0
      ? Math.min(
          100,
          Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100)
        )
      : 0;

  const closeApp = () => {
    if (typeof window.require !== "function") return;
    window.require("electron").ipcRenderer.invoke("close-window");
  };

  return (
    <div className="app" data-mode={mode}>
      {/* ================= CAT ================= */}
      <div className="cat-layer">
        <img
          className="cat"
          src={mode !== "idle" ? sprites[animation] : catFace}
          draggable={false}
          alt="cat"
        />
      </div>

      {/* ================= UI ================= */}
      <div
        className={`ui ${mode === "idle" ? "settings-ui" : "timer-ui"}`}
      >
        <button
          className="title-btn"
          onClick={closeApp}
          aria-label="Close app"
          title="Close"
        >
          ✕
        </button>

        {/* SETTINGS */}
        {mode === "idle" && (
          <>
            <h2>Kitty Timer</h2>

            {completedFocusSessions > 0 && (
              <p className="session-summary">
                🍅 {completedFocusSessions} session
                {completedFocusSessions === 1 ? "" : "s"} completed
              </p>
            )}

            <div className="row">
              <label htmlFor="focus-select">Focus</label>
              <select
                id="focus-select"
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
              >
                {FOCUS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t} min
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <label htmlFor="break-select">Break</label>
              <select
                id="break-select"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
              >
                {BREAK_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t} min
                  </option>
                ))}
              </select>
            </div>

            <div className="row toggle-row">
              <label htmlFor="auto-start-toggle">Auto-start next</label>
              <input
                id="auto-start-toggle"
                type="checkbox"
                checked={autoStartNext}
                onChange={(e) => setAutoStartNext(e.target.checked)}
              />
            </div>

            <div className="row toggle-row">
              <label htmlFor="sound-toggle">Sound &amp; alerts</label>
              <input
                id="sound-toggle"
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            </div>

            <button className="start-btn" onClick={start}>
              Start
            </button>
          </>
        )}

        {/* TIMER */}
        {mode !== "idle" && (
          <>
            <div className="timer-bar">
              <span className="mode-label">
                {mode === "focus" ? "Focus" : "Break"}
                {isPaused ? " · Paused" : ""}
              </span>
              <span className="time">{formatTime(secondsLeft)}</span>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="controls-row">
              <button
                className="icon-btn"
                onClick={togglePause}
                aria-label={isPaused ? "Resume timer" : "Pause timer"}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? "▶" : "⏸"}
              </button>

              <span
                className="session-count"
                title="Completed focus sessions this run"
              >
                🍅 {completedFocusSessions}
              </span>

              <button
                className="icon-btn"
                onClick={skip}
                aria-label="Skip to next session"
                title="Skip"
              >
                ⏭
              </button>

              <button
                className="icon-btn danger"
                onClick={stop}
                aria-label="Stop timer"
                title="Stop"
              >
                ■
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
