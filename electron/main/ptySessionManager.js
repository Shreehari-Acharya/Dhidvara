import { PtyManager } from './ptyProcess.js';
import { v4 as uuidv4 } from 'uuid';

export class PtySessionManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.sessions = new Map(); // sessionId -> PtyManager
  }

  createSession() {
    const sessionId = uuidv4(); // Generate a unique session ID
    const manager = new PtyManager(sessionId, this.mainWindow);
    manager.createPty();
    this.sessions.set(sessionId, manager);
    return sessionId;
  }

  writeToSession(sessionId, data) {
    const manager = this.sessions.get(sessionId);
    if (manager) {
      manager.write(data);
    }
  }

  resizeSession(cols, rows) {
    this.sessions.forEach((manager) => {
      manager.resize(cols, rows);
    });
  }

  closeSession(sessionId) {
    const manager = this.sessions.get(sessionId);
    if (manager) {
      manager.dispose();
      this.sessions.delete(sessionId);
    }
  }

  closeAll() {
    for (const [sessionId, manager] of this.sessions.entries()) {
      manager.dispose();
    }
    this.sessions.clear();
  }

  async executeCommand(sessionId, command) {

    const manager = this.sessions.get(sessionId);
    if (manager) {
      
      const res =  await manager.executeCommand(command);
      return res;
    }
  }
}

