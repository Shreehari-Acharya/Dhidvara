import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { debounce } from '../utils/debounce';


export class TerminalInstance {
  constructor({ container, sessionId, onResize }) {
    this.term = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 18,
      lineHeight: 1.2,
      cursorStyle: 'underline',
      allowProposedApi: true,
      scrollback: 1000,
      theme: {
        background: '#0F1618',
        foreground: '#ECF6EF',
        cursor: '#00FFF4',
        selection: '#E3F7FC',
        black: '#0D1213',
        red: '#FF4545',
        green: '#58EA56',
        yellow: '#F9FE47',
        blue: '#66D9E1',
        magenta: '#BC5EDD',
        cyan: '#73D8E1',
        white: '#F7F8F8',
        brightBlack: '#666666',
        brightRed: '#E60F0F',
        brightGreen: '#0BEE06',
        brightYellow: '#F2E706',
        brightBlue: '#2BCAFF',
        brightMagenta: '#EC0AFF',
        brightCyan: '#00FFFD',
        brightWhite: '#eaeaea',
      },
    });

    this.sessionId = sessionId;
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(container);
    this.fitAddon.fit();

    this.markerRef = null;
    this.decorationRef = null;
    this.onResizeCallback = onResize;
    this.debouncedRenderGhost = debounce((text) => {
      if (text) {
        this.renderGhostText(text);
      } else {
        this.clearDecoration();
      }
    }, 800);

    this.initIPCListeners();
    this.setupInput();
    window.addEventListener('resize', this.handleResize);
  }

  setupInput() {
    let fullCommand = '';

    this.term.onKey((e) => {
      const ev = e.domEvent;
      const key = ev.key;
      if(key === 'Enter') {
        if(fullCommand.trim().startsWith('@')) {
          const command = fullCommand.trim().slice(1);
          if(command.length == 0){
            this.clearDecoration();
            new window.Notification("Pass your command after @ symbol", {
              body: 'Command cannot be empty',
            });
            window.terminalAPI.sendInput(this.sessionId, '\n');
            return;
          }
          window.terminalAPI.sendAgentInput(this.sessionId, command);
          this.clearDecoration();
          fullCommand = '';
        }
      }
    });

    this.term.onData((data) => {
      if (data === 'clear\n') {
        this.term.reset();
        this.clearDecoration();
        fullCommand = '';
      } else if (data === '\t') {
        const ghost = this.decorationRef?.element?.innerText;
        if (ghost) {
          window.terminalAPI.sendInput(this.sessionId, ghost);
          this.clearDecoration();
          fullCommand = '';
        } else {
          window.terminalAPI.sendInput(this.sessionId, data);
          fullCommand = '';
        }
      } else if(data == '\b' || data == '\x7f') {

        if (fullCommand.length > 0) {
          if(fullCommand.trim().startsWith('@')){
            this.term.write('\b \b');
          }
          else {
            window.terminalAPI.sendInput(this.sessionId, data);
          }
          fullCommand = fullCommand.slice(0, -1);
          if(fullCommand.length === 0) {
            this.clearDecoration();
          }
        }
      }
      else {
        
        fullCommand += data;
        console.log("Data:", fullCommand);
        if (fullCommand.trim().startsWith('@')) {
          this.term.write(data);
        } else {
          window.terminalAPI.sendInput(this.sessionId, data);
        }
      }
    });
  }

  initIPCListeners() {
    window.terminalAPI.onOutput(this.sessionId, (data) => {
      this.term.write(data);
      this.clearDecoration();
    });

    window.aiAPI.onSuggestedCommand(this.sessionId, (suggestion) => {
      this.debouncedRenderGhost(suggestion.next_portion);
    });
  }

  renderGhostText(ghostText) {
    this.clearDecoration();
    const buffer = this.term.buffer.active;
    const col = buffer.cursorX;

    const marker = this.term.registerMarker(0);
    if (!marker) return;
    this.markerRef = marker;

    const decoration = this.term.registerDecoration({
      marker,
      x: col,
      width: ghostText.length,
    });

    if (decoration) {
      decoration.onRender((el) => {
        el.innerText = ghostText;
        el.style.color = '#cdcdcd';
        el.style.opacity = '0.4';
        el.style.pointerEvents = 'none';
        el.style.fontStyle = 'italic';
        el.style.fontSize = '18px';
        el.style.fontFamily = 'JetBrains Mono, monospace';
        el.style.whiteSpace = 'pre';
      });
      this.decorationRef = decoration;
    }
  }

  clearDecoration() {
    this.decorationRef?.dispose();
    this.markerRef?.dispose();
    this.decorationRef = null;
    this.markerRef = null;
  }

  resize() {
    try {
      this.fitAddon.fit();
      const { cols, rows } = this.term;
      window.terminalAPI.resizeTerminal(cols, rows);
      if (this.onResizeCallback) {
        this.onResizeCallback();
      }
    } catch (error) {
      console.error('Error resizing terminal:', error);
    }
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.clearDecoration();
    this.term.dispose();
    this.fitAddon.dispose();
    window.terminalAPI.removeOutputListener(this.sessionId);
    window.aiAPI.removeSuggestionListener(this.sessionId);
  }
}