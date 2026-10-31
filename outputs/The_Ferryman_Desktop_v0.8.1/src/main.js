import { app, BrowserWindow } from 'electron';
import path from 'node:path';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Echo renderer console output to this process's stdout (visible in `npm start`).
  mainWindow.webContents.on('console-message', (event, ...legacy) => {
    const message = event.message ?? legacy[1];
    console.log(`[renderer] ${message}`);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Dev only: FERRY_QUERY="?scene=DeliveryScene&fixture=delivery" opens one scene with a fixture.
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + (process.env.FERRY_QUERY ?? ''));
    if (process.env.FERRY_DEVTOOLS) mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  createWindow();

  // On macOS re-create a window when the dock icon is clicked and none are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
