// src/main/ipcHandlers/terminalInputHandler.js
import { getCommandState } from "../commandState.js";
import { ipcMain } from "electron";
import { performWithGroq } from "../../groq/index.js";
import { getSettings } from "../../config/settings.js";
import { Notification } from "electron";

const { aiSuggestionsEnabled,aiEnabled } = getSettings();

function handleSuggestion(mainWindow, sessionId, commandState, suggestion) {
  if (suggestion) {
    mainWindow.webContents.send('suggested-command', { sessionId, suggestion });
  } else {
    commandState.suggestedCommand = null;
    mainWindow.webContents.send('suggested-command', { sessionId, suggestion: null });
  }
}

async function processCommandInput(mainWindow, sessionManager, sessionId, data) {
  const commandState = getCommandState(sessionId);

  sessionManager.writeToSession(sessionId, data);

  if(!aiSuggestionsEnabled) {
    return;
  }

  switch (data) {
    case '\r': // Enter
      if (commandState.currentCommand.trim()) {
        commandState.addToHistory(commandState.currentCommand.trim());
        commandState.updateCommand('');
        commandState.suggestedCommand = null;
      }
      break;

    case '\x7f': // Backspace
      if (commandState.currentCommand.length > 0) {
        commandState.updateCommand(commandState.currentCommand.slice(0, -1));
        const suggestion = commandState.suggestedCommand;
        if (suggestion?.next_portion) {
          const offset = suggestion.full_command.indexOf(suggestion.next_portion);
          if (offset > 0) {
            suggestion.next_portion = suggestion.full_command[offset - 1] + suggestion.next_portion;
            handleSuggestion(mainWindow, sessionId, commandState, suggestion);
          }
        }
      }
      break;

    case '\x1b[A': // Up arrow
    case '\x1b[B': // Down arrow
      const isUpArrow = data === '\x1b[A';
      const historyIndex = commandState.historyIndex + (isUpArrow ? -1 : 1);
      if (historyIndex >= 0 && historyIndex <= commandState.history.length) {
        commandState.historyIndex = historyIndex;
        const nextCommand = commandState.history[historyIndex] || '';
        commandState.updateCommand(nextCommand);
        try {
          const suggestion = await commandState.debouncedSuggest();
          handleSuggestion(mainWindow, sessionId, commandState, suggestion);
        } catch (err) {
          console.warn('Suggestion failed:', err);
        }
      }
      break;

    default:
      if (data.startsWith('\x1b')) break; // Skip escape sequences

      commandState.updateCommand(commandState.currentCommand + data);

      if (commandState.currentCommand === commandState.suggestedCommand?.full_command) {
        handleSuggestion(mainWindow, sessionId, commandState, null);
        break;
      }

      if (commandState.suggestedCommand?.next_portion.startsWith(data)) {
        commandState.suggestedCommand.next_portion = commandState.suggestedCommand.next_portion.slice(1);
        handleSuggestion(mainWindow, sessionId, commandState, commandState.suggestedCommand);
      } else {
        try {
          const suggestion = await commandState.debouncedSuggest();
          handleSuggestion(mainWindow, sessionId, commandState, suggestion);
        } catch (error) {
          console.warn('Suggestion failed:', error);
        }
      }
      break;
  }
}

export function setTerminalHandler(mainWindow, sessionManager) {
  ipcMain.handle('create-terminal-session', () => sessionManager.createSession());

  ipcMain.on('terminal-input', (event, { sessionId, data }) => {
    processCommandInput(mainWindow, sessionManager, sessionId, data);
  });

  ipcMain.on('terminal-resize', (event, { cols, rows }) => {
    sessionManager.resizeSession(cols, rows);
  });

  ipcMain.on('agent-input', async (event, { sessionId, data }) => {
    if(!aiEnabled) {
      new Notification({
        title: 'Agent Input Disabled',
        body: 'Agent input is disabled in the current settings.',
      }).show();
      return;
    }
    const executeFnCallback = async (sessionId, data) => { return await sessionManager.executeCommand(sessionId, data) };
    await performWithGroq(data, executeFnCallback, sessionId);
  });

  ipcMain.on('close-terminal-session', (event, sessionId) => {
    sessionManager.closeSession(sessionId);
  });
}
