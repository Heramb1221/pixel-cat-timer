/// <reference types="react-scripts" />

// The renderer runs with nodeIntegration enabled (see public/electron.js),
// so `require` is available on `window` for reaching Electron's ipcRenderer.
interface Window {
  require: (module: "electron") => {
    ipcRenderer: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
  };
}
