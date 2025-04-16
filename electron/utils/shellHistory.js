import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectShellType } from './detectShell.js';

// get the shell history from the user's home directory
// the history is limited to the last max unique commands
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
  
      // Remove duplicates while preserving order
      const uniqueCommands = [];
      const seen = new Set();
      for (let i = cleanLines.length - 1; i >= 0; i--) {
        if (!seen.has(cleanLines[i])) {
          uniqueCommands.push(cleanLines[i]);
          seen.add(cleanLines[i]);
        }
        if (uniqueCommands.length === max) break;
      }
  
      return uniqueCommands.reverse(); // Reverse to maintain original order
    } catch (err) {
      console.error('Failed to read shell history:', err);
      return [];
    }
  }