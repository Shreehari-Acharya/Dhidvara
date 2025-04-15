// src/main/ipcHandlers/terminalInputHandler.js
import { getCommandState } from "../commandState.js";
import { ipcMain } from "electron";

export function setTerminalHandler(mainWindow, sessionManager) {

  ipcMain.handle('create-terminal-session', () => {
    return sessionManager.createSession();
  }
  );
  // handler for terminal input
  // this is where we handle the input from the renderer
  // and send it to the pty process
  // we also do suggestions from groq in here, and send it back to renderer
  ipcMain.on('terminal-input', async (event, { sessionId, data }) => {

    const commandState = getCommandState(sessionId);

    // Don't write 'clear' — frontend handles
    if (data !== 'clear\n') {
      sessionManager.writeToSession(sessionId,data);
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

          // Reconstruct next portion
          const suggestion = commandState.suggestedCommand;
          if (suggestion?.next_portion) {
            const offset = suggestion.full_command.indexOf(suggestion.next_portion);
            if (offset > 0) {
              const prevChar = suggestion.full_command[offset - 1];
              suggestion.next_portion = prevChar + suggestion.next_portion;
              console.log('Updated suggestion from backspace:', suggestion);
              mainWindow.webContents.send('suggested-command', {sessionId: sessionId, suggestion: suggestion });
            }
          }
        }
        break;

      case '\x1b[A': // Up arrow
        if (commandState.historyIndex > 0) {
          commandState.historyIndex--;
          commandState.updateCommand(commandState.history[commandState.historyIndex]);

          try {
            const suggestion = await commandState.debouncedSuggest();
            if (suggestion){
              console.log('Updated suggestion from up arrow:', suggestion);
              mainWindow.webContents.send('suggested-command', {sessionId: sessionId, suggestion: suggestion});
            } 
          } catch (err) {
            console.warn('Suggestion failed:', err);
          }
        }
        break;

      case '\x1b[B': // Down arrow
        if (commandState.historyIndex < commandState.history.length) {
          commandState.historyIndex++;
          const nextCommand =
            commandState.historyIndex < commandState.history.length
              ? commandState.history[commandState.historyIndex]
              : '';
          commandState.updateCommand(nextCommand);

          try {
            const suggestion = await commandState.debouncedSuggest();
            if (suggestion){
              console.log('Updated suggestion from down arrow:', suggestion);
              mainWindow.webContents.send('suggested-command', {sessionId:sessionId, suggestion: suggestion});
            } 
          } catch (err) {
            console.warn('Suggestion failed:', err);
          }
        }
        break;

      default:
        if (data.startsWith('\x1b')) break; // Skip escape sequences

        commandState.updateCommand(commandState.currentCommand + data);

        if (commandState.currentCommand === commandState.suggestedCommand?.full_command) {
          commandState.suggestedCommand = null;
          console.log('Cleared suggestion:', commandState.suggestedCommand);
          mainWindow.webContents.send('suggested-command', {sessionId:sessionId, suggestion:null});
          break;
        }

        if (
          commandState.suggestedCommand &&
          commandState.suggestedCommand.next_portion.startsWith(data)
        ) {
          commandState.suggestedCommand.next_portion =
            commandState.suggestedCommand.next_portion.slice(1);
          console.log('Updated suggestion:', commandState.suggestedCommand);
          mainWindow.webContents.send('suggested-command', {sessionId:sessionId, suggestion:commandState.suggestedCommand});
        } else {
          try {
            const suggestion = await commandState.debouncedSuggest();
            if (suggestion) {
              console.log('Updated suggestion from groq:', suggestion);
              mainWindow.webContents.send('suggested-command', {sessionId:sessionId, suggestion:suggestion});
            }
          } catch (error) {
            console.warn('Suggestion failed:', error);
            commandState.suggestedCommand = null;
          }
        }
        break;
    }
  });

  //handler for terminal resize.
  ipcMain.on('terminal-resize', (event, { cols, rows }) => {
    sessionManager.resizeSession(cols, rows);
  });

  ipcMain.on('close-terminal-session', (event, sessionId) => {
    sessionManager.closeSession(sessionId);
  });
}
