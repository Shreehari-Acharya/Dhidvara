const { contextBridge, ipcRenderer } = require('electron');

const outputCallbacks = new Map();
const suggestionCallbacks = new Map();
const exitedCallbacks = new Set();

ipcRenderer.on('terminal-output', (event, { sessionId, data }) => {
  const callback = outputCallbacks.get(sessionId);
  if (callback) {
    callback(data);
  }
});

ipcRenderer.on('suggested-command', (event, { sessionId, suggestion }) => {
  const callback = suggestionCallbacks.get(sessionId);
  if (callback) {
    callback(suggestion);
  }
});

ipcRenderer.on('terminal-exited', (event, { sessionId }) => {
  exitedCallbacks.forEach(callback => callback(sessionId));
});

contextBridge.exposeInMainWorld('terminalAPI', {
  createTerminalSession: () => ipcRenderer.invoke('create-terminal-session'),
  sendInput: (sessionId, data) => ipcRenderer.send('terminal-input', { sessionId, data }),
  sendAgentInput: (sessionId, data) => ipcRenderer.send('agent-input', { sessionId, data }),
  resizeTerminal: (sessionId, cols, rows) => ipcRenderer.send('resize-terminal', { sessionId, cols, rows }),
  closeTerminalSession: (sessionId) => ipcRenderer.send('close-terminal-session', sessionId),
  onOutput: (sessionId, callback) => {
    outputCallbacks.set(sessionId, callback);
  },
  onTerminalExited: (callback) => {
    exitedCallbacks.add(callback);
  },
  removeOutputListener: (sessionId) => {
    outputCallbacks.delete(sessionId);
  },
  removeTerminalExitedListener: (callback) => {
    exitedCallbacks.delete(callback);
  },
});

contextBridge.exposeInMainWorld('aiAPI', {
  onSuggestedCommand: (sessionId, callback) => {
    suggestionCallbacks.set(sessionId, callback);
  },
  removeSuggestionListener: (sessionId) => {
    suggestionCallbacks.delete(sessionId);
  },
});