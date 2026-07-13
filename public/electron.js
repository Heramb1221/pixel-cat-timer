const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

const CAT_MOVE_DURATION = 7000;

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 280,
    height: 280,
    title: "Pixel Cat Timer",

    frame: false,
    transparent: true,
    backgroundColor: "#00000000",

    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000");
    //mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.center();
    mainWindow.setAlwaysOnTop(true, "floating");
    mainWindow.setVisibleOnAllWorkspaces(true);
  });
}

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("close-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.handle("move-center", () => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const bounds = mainWindow.getBounds();

  return moveWindowTo(
    Math.round(width / 2 - bounds.width / 2),
    Math.round(height / 2 - bounds.height / 2)
  );
});

ipcMain.handle("move-bottom-right", () => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  return moveWindowTo(
    width - mainWindow.getBounds().width,
    height - mainWindow.getBounds().height
  );
});

function moveWindowTo(targetX, targetY) {
  return new Promise((resolve) => {

    if (!mainWindow) {
      resolve();
      return;
    }

    const start = mainWindow.getBounds();

    const fps = 60;
    const steps = fps * (CAT_MOVE_DURATION / 1000);

    let i = 0;

    const interval = CAT_MOVE_DURATION / steps;

    const timer = setInterval(() => {

      i++;

      const progress = i / steps;

      const ease = 1 - Math.pow(1 - progress, 3);

      const x = Math.round(
        start.x + (targetX - start.x) * ease
      );

      const y = Math.round(
        start.y + (targetY - start.y) * ease
      );

      mainWindow.setPosition(x, y);

      if (i >= steps) {
        clearInterval(timer);
        resolve();
      }

    }, interval);
  });
}