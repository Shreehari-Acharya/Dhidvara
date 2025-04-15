// src/main/CommandState.js
import { getInitialShellHistory } from '../utils/shellHistory.js';
import { debounceAsync } from '../utils/debounceAsync.js';
import { getGroqCommandCompletion } from '../groq/index.js';

class CommandState {
  constructor() {
    this.currentCommand = '';
    this.history = getInitialShellHistory(10);
    this.historyIndex = this.history.length;
    this.suggestedCommand = null;
    this.debouncedSuggest = debounceAsync(this.requestSuggestion.bind(this), 200);
  }

  updateCommand(command) {
    this.currentCommand = command;
  }

  addToHistory(command) {
    this.history.push(command);
    this.historyIndex = this.history.length;
  }

  async requestSuggestion() {
    this.suggestedCommand = await getGroqCommandCompletion(this.history, this.currentCommand);
    return this.suggestedCommand;
  }
}

const commandStore = {};

export function getCommandState(sessionId) {
  if (!commandStore[sessionId]) {
    commandStore[sessionId] = new CommandState();
  }
  return commandStore[sessionId];
}

export function clearCommandState(sessionId) {
  delete commandStore[sessionId];
}