const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('terminalAPI', {
  sendInput: (input) => ipcRenderer.send('terminal-input', input),
  onOutput: (callback) => ipcRenderer.on('terminal-output', (e, data) => callback(data)),
  getTerminal: () => ipcRenderer.send('create-terminal'),
  resizeTerminal: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),
})

contextBridge.exposeInMainWorld('aiAPI', {
  onSuggestedCommand: (callback) => ipcRenderer.on('suggested-command', (e, data) => callback(data)),
})