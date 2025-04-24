import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTerminalHandler } from './main/ipcHandlers/terminalHandler.js';
import { PtySessionManager } from './main/ptySessionManager.js';
import { setSettingsHandler } from './main/ipcHandlers/settingHandler.js';
import { Menu } from 'electron';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const isDev = !app.isPackaged;
Menu.setApplicationMenu(null);

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, './DhidvaraLogo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
  });

  const ptySessions = new PtySessionManager(mainWindow);
  // if (isDev) {
  //   await mainWindow.loadURL('http://localhost:5173');
  // } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  // }
  setSettingsHandler(mainWindow);
  setTerminalHandler(mainWindow, ptySessions);

  mainWindow.on('closed', () => {
    ptySessions.closeAll();
    mainWindow = null;
  });
 
}

app.whenReady().then(createWindow);
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});