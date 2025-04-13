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

let currentCommand = ''; // we will use it to store current command and then update history
const maxHistorySize = 10; // we will use it to limit the size of the history
let commandHistory = getInitialShellHistory(maxHistorySize); // we will use it to store the history of commands
let historyIndex = commandHistory.length; // we will use it to store the index of the current command

// Debounced function for getting command completion
const debouncedSuggest = debounceAsync(getGroqCommandCompletion, 400);

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
    ipcMain.on('terminal-input', async (event, data) => {
      ptyProcess.write(data);
      switch (data) {
        case '\r': // Enter key
          if(currentCommand.trim()){
            if(commandHistory.length >= maxHistorySize){
              commandHistory.shift(); // remove the oldest command
            }
            commandHistory.push(currentCommand); // add the current command to the history
            historyIndex = commandHistory.length; // set the index to the end of the history
            currentCommand = ''; // reset the current command
          }
          break;
        case '\x7f': // Backspace key
          if (currentCommand.length > 0) {
            currentCommand = currentCommand.slice(0, -1); // remove the last character from the current command
          }
          break;
        case '\x1b[A': // Up arrow key
          if (historyIndex > 0) {
            historyIndex--;
            currentCommand = commandHistory[historyIndex] + " "; // get the previous command from the history and add a space

            // const guessedCommand = await getGroqCommandCompletion(commandHistory, currentCommand);
          }
          break;
        case '\x1b[B': // Down arrow key
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            currentCommand = commandHistory[historyIndex] + " "; // get the next command from the history and add a space

            // const guessedCommand = await getGroqCommandCompletion(commandHistory, currentCommand);
          }
          break;
        default:
          currentCommand += data; // add the character to the current command
          
          debouncedSuggest(commandHistory, currentCommand).then(suggestedCommand => {
            console.log('Debounced suggested command:', suggestedCommand);
            mainWindow.webContents.send('suggested-command', suggestedCommand); // Send suggestion to renderer
          });
          break;
      }
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
  
  // When the enrire app is closed, kill the ptyProcess to prevent errors
  app.on('before-quit', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
  });

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