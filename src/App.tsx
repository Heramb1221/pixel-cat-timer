import { useState } from "react";
import { usePomodoro } from "./usePomodoro";
import { useCatAnimation } from "./useCatAnimation";

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

export default function App() {
  const [focus, setFocus] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  const { mode, secondsLeft, start, stop } = usePomodoro({
    focusMinutes: focus,
    breakMinutes: breakTime,
  });

  const { animation } = useCatAnimation(mode);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const closeApp = () => {
    window.require("electron")
      .ipcRenderer
      .invoke("close-window");
  };

  const moveBottomRight = () => {
    window.require("electron")
      .ipcRenderer
      .invoke("move-bottom-right");
  };

  return (
    <div className="app" data-mode={mode}>
      {/* ================= CAT ================= */}
      <div className="cat-layer">

        <img
          className="cat"
          src={
            mode !== "idle"
              ? sprites[animation]
              : catFace
          }
          draggable={false}
          alt="cat"
        />

      </div>


      {/* ================= UI ================= */}
      <div
        className={`ui ${mode === "idle"
            ? "settings-ui"
            : "timer-ui"
          }`}
      >
<button
          className="title-btn"
          onClick={closeApp}
        >
          ✕
        </button>
        {/* SETTINGS */}
        {mode === "idle" && (
          <>
            <h2>
              Kitty Timer
            </h2>


            <div className="row">
              <label>
                Focus
              </label>

              <select
                value={focus}
                onChange={(e) =>
                  setFocus(Number(e.target.value))
                }
              >
                {[1,15, 20, 25, 30, 45, 60].map((t) => (
                  <option
                    key={t}
                    value={t}
                  >
                    {t} min
                  </option>
                ))}
              </select>
            </div>


            <div className="row">
              <label>
                Break
              </label>

              <select
                value={breakTime}
                onChange={(e) =>
                  setBreakTime(Number(e.target.value))
                }
              >
                {[5, 10, 15, 20].map((t) => (
                  <option
                    key={t}
                    value={t}
                  >
                    {t} min
                  </option>
                ))}
              </select>
            </div>


            <button
              className="start-btn"
              onClick={() => {
                start();
              }}
            >
              Start
            </button>
          </>
        )}


        {/* TIMER */}
        {mode !== "idle" && (
          <>
            <div className="timer-bar">

              <span className="mode-label">
                {mode === "focus"
                  ? "Focus"
                  : "Break"}
              </span>

              <span>
                <button
                  onClick={stop}
                >
                  Stop
                </button>
              </span>

              <span className="time">
                {formatTime(secondsLeft)}
              </span>

            </div>




          </>
        )}

      </div>

    </div>
  );
}