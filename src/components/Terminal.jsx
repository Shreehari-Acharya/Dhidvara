import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { debounce } from '../utils/debounce.js';

export default function TerminalComponent() {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const decorationRef = useRef(null);
  const markerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const term = new Terminal({
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
    const fitAddon = new FitAddon();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    const updateGhostText = (command) => {
      if (!isMountedRef.current || !command) return;

      // Cleanup previous decorations
      decorationRef.current?.dispose();
      markerRef.current?.dispose();

      const buffer = term.buffer.active;
      const col = buffer.cursorX;

      // Use cursorY directly as marker row
      const marker = term.registerMarker(0);
      if (!marker) {
        console.warn('Failed to create marker, retrying...');
        setTimeout(() => updateGhostText(command), 50);
        return;
      }

      markerRef.current = marker;

      const decoration = term.registerDecoration({
        marker,
        x: col,
        width: command.length,
      });

      if (decoration) {
        decoration.onRender((el) => {
          if (!isMountedRef.current) return;
          el.innerText = command;
          el.style.color = '#cdcdcd';
          el.style.opacity = '0.4';
          el.style.pointerEvents = 'none';
          el.style.fontStyle = 'italic';
          el.style.fontSize = '18px';
          el.style.fontFamily = 'JetBrains Mono, monospace';
          el.style.whiteSpace = 'pre'; // Prevent wrapping
        });
        decorationRef.current = decoration;
      }
    };

    // Handle terminal input
    term.onData((data) => {
      if (data === 'clear\n') {
        term.reset();
        decorationRef.current?.dispose();
        markerRef.current?.dispose();
      }
      else if (data === '\t') {
        // Handle tab completion when ghost suggestion is present
        const fullCommand = decorationRef.current?.element.innerText;
        if(fullCommand && fullCommand.length > 0) {
        window.terminalAPI.sendInput(fullCommand);
        // Clear ghost text after output to avoid stale suggestions
        decorationRef.current?.dispose();
        markerRef.current?.dispose();
        }
        else {
          // Handle tab completion
          window.terminalAPI.sendInput(data);
        }
      }
       else {
        window.terminalAPI.sendInput(data);
      }
    });

    // Handle terminal output
    window.terminalAPI.onOutput((data) => {
      term.write(data);
      // Clear ghost text after output to avoid stale suggestions
      decorationRef.current?.dispose();
      markerRef.current?.dispose();
    });

    // Handle suggested commands
    window.aiAPI.onSuggestedCommand((data) => {
      if (!isMountedRef.current || !data?.next_portion) return;
      // Update ghost text immediately
      console.log('recieved command:', data.next_portion);
      setTimeout(() => {
        updateGhostText(data.next_portion);
      }, 100);
    });

    // Resize handler
    const handleResize = () => {
      fitAddon.fit();
      const { cols, rows } = term;
      window.terminalAPI.resizeTerminal(cols, rows);
    };

    const debouncedResize = debounce(handleResize, 200); // Reduced for responsiveness

    window.terminalAPI.getTerminal();

    window.addEventListener('resize', debouncedResize);

    return () => {
      isMountedRef.current = false;
      decorationRef.current?.dispose();
      markerRef.current?.dispose();
      term.dispose();
      window.removeEventListener('resize', debouncedResize);
      fitAddon.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full bg-blue-400" />;
}
