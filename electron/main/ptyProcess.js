import * as pty from 'node-pty';

export class PtyManager {
  constructor(sessionId, mainWindow) {
    this.sessionId = sessionId;
    this.mainWindow = mainWindow;
    this.ptyProcess = null;
  }

  createPty() {
    try {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      this.ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 24,
          cwd: process.env.HOME,
          env: process.env,
      });
  
      this.ptyProcess.onData((data) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('terminal-output', { sessionId: this.sessionId, data: data });
        }
      });
  
      this.ptyProcess.onExit(({ exitCode }) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('terminal-output', `\n[EXIT]\n`);
          this.mainWindow.close();
          ptyProcess = null;
        }
        this.dispose();
      });
    } catch (error) {
      console.error('PTY Error:', error);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('terminal-output', `\n[Error: Failed to start terminal]\n`);
      }
    }
  }
  write(data) {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    }
  }

  resize(cols, rows) {
    if (this.ptyProcess) {
      this.ptyProcess.resize(cols, rows);
    }
  }

  kill() {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }
  dispose() {
    this.kill();
    this.mainWindow = null;
  }

  executeCommand(command) {
    return new Promise((resolve) => {
      let output = '';
  
      const onData = (data) => {
        output += data;
  

        if (output.includes('__END__')) {
          // Safely remove the listener if the process still exists
          if (this.ptyProcess) {
            this.ptyProcess.removeListener('data', onData);
          }
          console.log('Output:', output);
          resolve(output.replace('__END__', '').trim());
        }
      };
  
      if (this.ptyProcess) {
        this.ptyProcess.onData(onData);
        this.ptyProcess.write(`${command} && echo "__END__"\r\n`);
      } else {
        resolve('[ERROR] Terminal not available');
      }
    });
  }
}



  
