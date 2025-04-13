import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectShellType } from './detectShell.js';

// get the shell history from the user's home directory
// the history is limited to the last max commands
// the history is returned as an array of strings
// wont work for powershell and cmd
export function getInitialShellHistory(max) {
    const homeDir = os.homedir();
    const shellType = detectShellType();
    let historyPath = '';
  
    switch (shellType) {
      case 'zsh':
        historyPath = path.join(homeDir, '.zsh_history');
        break;
      case 'bash':
        historyPath = path.join(homeDir, '.bash_history');
        break;
      default:
        return []; // PowerShell, CMD, unknown – no reliable history file
    }
  
    try {
      const content = fs.readFileSync(historyPath, 'utf8');
      const lines = content.trim().split('\n');
  
      // For zsh, strip metadata (e.g. ": 1677887690:0;ls")
      const cleanLines = lines
        .map(line => line.replace(/^: \d+:\d+;/, '').trim())
        .filter(Boolean);
  
      return cleanLines.slice(-max);
    } catch (err) {
      console.error('Failed to read shell history:', err);
      return [];
    }
  }