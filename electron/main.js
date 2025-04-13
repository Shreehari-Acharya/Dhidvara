import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';
import { getGroqCommandCompletion } from './groq/index.js';
import { getInitialShellHistory } from './utils/shellHistory.js';
import { debounceAsync } from './utils/debounceAsync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let ptyProcess;
let commandState = {
  currentCommand: '',
  history: getInitialShellHistory(10),
  historyIndex: getInitialShellHistory(10).length,
  suggestedCommand: null,
};
const maxHistorySize = 10;

const isDev = !app.isPackaged;

const debouncedSuggest = debounceAsync(getGroqCommandCompletion, 300); // Reduced for responsiveness

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  ipcMain.on('create-terminal', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }

    try {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 40,
        cwd: process.env.HOME,
        env: process.env,
      });

      ptyProcess.onData((data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-output', data);
        }
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal-output', `\n[Process exited with code ${exitCode}]\n`);
          ptyProcess = null;
        }
      });
    } catch (error) {
      console.error('PTY Error:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-output', `\n[Error: Failed to start terminal]\n`);
      }
    }
  });

  ipcMain.on('terminal-input', async (event, data) => {
    if (!ptyProcess) return;

    // Skip clear since frontend handles it
    if (data !== 'clear\n') {
      ptyProcess.write(data);
    }

    switch (data) {
      case '\r': // Enter
        if (commandState.currentCommand.trim()) {
          if (commandState.history.length >= maxHistorySize) {
            commandState.history.shift();
          }
          commandState.history.push(commandState.currentCommand.trim());
          commandState.historyIndex = commandState.history.length;
          commandState.currentCommand = '';
          commandState.suggestedCommand = null;
        }
        break;
      case '\x7f': // Backspace
        if (commandState.currentCommand.length > 0) {
          commandState.currentCommand = commandState.currentCommand.slice(0, -1);
          if (commandState.suggestedCommand?.next_portion) {
            const offset = commandState.suggestedCommand.full_command.indexOf(
              commandState.suggestedCommand.next_portion
            );
            if (offset > 0) {
              const prevChar = commandState.suggestedCommand.full_command[offset - 1];
              commandState.suggestedCommand.next_portion = prevChar + commandState.suggestedCommand.next_portion;
              mainWindow.webContents.send('suggested-command', commandState.suggestedCommand);
            }
          }
        }
        break;
      case '\x1b[A': // Up arrow
        if (commandState.historyIndex > 0) {
          commandState.historyIndex--;
          commandState.currentCommand = commandState.history[commandState.historyIndex] || '';
          try {
            const suggestion = await debouncedSuggest(commandState.history, commandState.currentCommand);
            if (suggestion) {
              commandState.suggestedCommand = suggestion;
              mainWindow.webContents.send('suggested-command', suggestion);
            }
          } catch (error) {
            console.warn('Suggestion failed:', error);
          }
        }
        break;
      case '\x1b[B': // Down arrow
        if (commandState.historyIndex < commandState.history.length) {
          commandState.historyIndex++;
          commandState.currentCommand =
            commandState.historyIndex < commandState.history.length
              ? commandState.history[commandState.historyIndex]
              : '';
          try {
            const suggestion = await debouncedSuggest(commandState.history, commandState.currentCommand);
            if (suggestion) {
              commandState.suggestedCommand = suggestion;
              mainWindow.webContents.send('suggested-command', suggestion);
            }
          } catch (error) {
            console.warn('Suggestion failed:', error);
          }
        }
        break;
      default:
        if (data.startsWith('\x1b')) {
          break;
        }
        commandState.currentCommand += data;
        if(commandState.currentCommand === commandState.suggestedCommand?.full_command) {
          commandState.suggestedCommand = null;
          mainWindow.webContents.send('suggested-command', null);
          break;
        } 
        if (
          commandState.suggestedCommand &&
          commandState.suggestedCommand.next_portion.startsWith(data) 
        ) {
          commandState.suggestedCommand.next_portion =
            commandState.suggestedCommand.next_portion.slice(1);
          mainWindow.webContents.send('suggested-command', commandState.suggestedCommand);
          console.log('from samechar:', commandState.suggestedCommand);
        } else {
          try {
            const suggestion = await debouncedSuggest(commandState.history, commandState.currentCommand);
            if (suggestion) {
              commandState.suggestedCommand = suggestion;
              mainWindow.webContents.send('suggested-command', suggestion);
              console.log('from groq:', suggestion);
            }
          } catch (error) {
            console.warn('Suggestion failed:', error);
            commandState.suggestedCommand = null;
          }
        }
        break;
    }
  });

  ipcMain.on('terminal-resize', (event, { cols, rows }) => {
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (error) {
        console.warn('Resize failed:', error);
      }
    }
  });

  mainWindow.on('closed', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
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