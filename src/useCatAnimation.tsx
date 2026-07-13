import { useEffect, useRef, useState } from "react";

export type CatAnimation =
  | "idle"
  | "walk"
  | "stretch"
  | "sleep"
  | "wake";


export function useCatAnimation(
  mode: "idle" | "focus" | "break"
) {
  const [animation, setAnimation] = useState<CatAnimation>("idle");

  const previousMode = useRef<"idle" | "focus" | "break">("idle");
  const CAT_MOVE_DURATION = 7000; // ms

  const moveWindow = (direction: "bottom-right" | "center") => {
    if (typeof window.require !== "function") return;

    window
      .require("electron")
      .ipcRenderer
      .invoke(`move-${direction}`);
  };


  useEffect(() => {
    const from = previousMode.current;

    previousMode.current = mode;


    // SETTINGS
    if (mode === "idle") {
      setAnimation("idle");
      return;
    }


    /*
      ============================
      IDLE -> FOCUS

      Walk to bottom right
      ============================
    */
    if (from === "idle" && mode === "focus") {

      setAnimation("walk");

      // move Electron window
      moveWindow("bottom-right");

      const idleTimer = setTimeout(() => {
        setAnimation("idle");
      }, CAT_MOVE_DURATION);


      return () => {
        clearTimeout(idleTimer);
      };
    }



    /*
      ============================
      BREAK -> FOCUS

      Wake -> Walk -> Idle
      Move to bottom right
      ============================
    */
    if (from === "break" && mode === "focus") {

      setAnimation("wake");


      const walkTimer = setTimeout(() => {

        setAnimation("walk");

        moveWindow("bottom-right");

      }, 1000);



      const idleTimer = setTimeout(() => {
        setAnimation("idle");
      }, 1000 + CAT_MOVE_DURATION);



      return () => {
        clearTimeout(walkTimer);
        clearTimeout(idleTimer);
      };
    }



    /*
      ============================
      FOCUS -> BREAK

      Walk -> Center
      Stretch -> Sleep
      ============================
    */
    if (from === "focus" && mode === "break") {

      setAnimation("walk");

      // move Electron window
      moveWindow("center");


      const stretchTimer = setTimeout(() => {
        setAnimation("stretch");
      }, CAT_MOVE_DURATION);



      const sleepTimer = setTimeout(() => {
        setAnimation("sleep");
      }, 1000+CAT_MOVE_DURATION);



      return () => {
        clearTimeout(stretchTimer);
        clearTimeout(sleepTimer);
      };
    }


  }, [mode]);


  return {
    animation
  };
}