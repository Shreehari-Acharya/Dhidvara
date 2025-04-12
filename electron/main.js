import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let ptyProcess;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  ipcMain.on('create-terminal', () => {

    // if it exists, we will kill it, and create a new one
    // this is to avoid multiple terminals being created
    // and to ensure that we are not leaking memory
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }

    try {
      // Create a new terminal process
      // Use node-pty to spawn a shell process
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 40,
        cwd: process.env.HOME,
        env: process.env,
      });

      // Listen for data from the terminal and send it to the renderer process
      ptyProcess.onData(data => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-output', data);
        }
      });

      // When the terminal exits, send a message to the renderer process
      ptyProcess.onExit(({ exitCode }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-output', `\n[Process exited with code ${exitCode}]\n`);
        }
      });
    } catch (error) {
      console.error('PTY Error:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-output', `\n[Error: Failed to start terminal]\n`);
      }
    }
  });

    // IPC listener for data from the renderer process

    // listening on terminal-input channel, will write data to the terminal (ptyProcess)
    ipcMain.on('terminal-input', (event, data) => {
      ptyProcess?.write(data);
    });

    // listening on terminal-resize channel, will resize the terminal (ptyProcess)
    ipcMain.on('terminal-resize', (event, { cols, rows }) => {
      ptyProcess?.resize(cols, rows);
    });

    // when the window is closed, kill the ptyProcess and set it to null
    mainWindow.on('closed', () => {
      ptyProcess?.kill();
      ptyProcess = null;
      mainWindow = null;
    });

  }

app.whenReady().then(createWindow);

  // Quit when all windows are closed, except on macOS. There, it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });