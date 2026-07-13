import { useEffect, useRef, useState } from "react";

type Mode = "idle" | "focus" | "break";

interface Options {
    focusMinutes: number;
    breakMinutes: number;
}

export function usePomodoro({focusMinutes, breakMinutes}: Options) {
    const [mode, setMode] = useState<Mode>("idle");
    const [secondsLeft, setSecondsLeft] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startFocus = () => {
        setMode("focus");
        setSecondsLeft(focusMinutes * 60);
    }

    const startBreak = () => {
        setMode("break");
        setSecondsLeft(breakMinutes * 60);
    }

    const stop = () => {
        setMode("idle");
        setSecondsLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }

    const start = () => {
        startFocus();
    }

    useEffect(() => {
        if(mode === "idle") return;

        intervalRef.current = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [mode]);

    useEffect(() => {
        if (secondsLeft > 0) return;

        if(mode === "focus") {
            startBreak();
        } else if(mode === "break") {
            startFocus();
        }
    }, [secondsLeft]);

    return {
        mode,
        secondsLeft,
        start,
        stop,
    }
}