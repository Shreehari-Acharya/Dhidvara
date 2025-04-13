export function detectShellType() {
    if (process.platform === 'win32') {
      const shell = process.env.ComSpec || '';
      if (shell.includes('powershell')) return 'powershell';
      if (shell.includes('cmd.exe')) return 'cmd';
      return 'windows-unknown';
    }
    if (process.env.SHELL?.includes('zsh')) return 'zsh';
    if (process.env.SHELL?.includes('bash')) return 'bash';
    return 'unknown';
  }