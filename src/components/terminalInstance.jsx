import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

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

    this.initIPCListeners();
    this.setupInput();
    window.addEventListener('resize', this.handleResize);
  }

  setupInput() {
    this.term.onData((data) => {
      if (data === 'clear\n') {
        this.term.reset();
        this.clearDecoration();
      } else if (data === '\t') {
        const ghost = this.decorationRef?.element?.innerText;
        if (ghost) {
          window.terminalAPI.sendInput(this.sessionId, ghost);
          this.clearDecoration();
        } else {
          window.terminalAPI.sendInput(this.sessionId, data);
        }
      } else {
        window.terminalAPI.sendInput(this.sessionId, data);
      }
    });
  }

  initIPCListeners() {
    window.terminalAPI.onOutput(this.sessionId, (data) => {
      this.term.write(data);
      this.clearDecoration();
    });

    window.aiAPI.onSuggestedCommand(this.sessionId, (suggestion) => {
      console.log('recieved command:', suggestion.next_portion);
      setTimeout(() => {
        this.renderGhostText(suggestion.next_portion);
      }, 100);
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
      if(this.onResizeCallback) {
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