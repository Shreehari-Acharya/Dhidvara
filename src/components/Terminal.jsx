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

      // Cleanup previous decorations
      decorationRef.current?.dispose();
      markerRef.current?.dispose();

      const col = term.buffer.active.cursorX;

      const marker = term.registerMarker(0);
      if (!marker) {console.log("error creating marker"); return;}

      markerRef.current = marker;

      const decoration = term.registerDecoration({
        marker,
        x: col,
        width: command.length,
      });
    
      if (decoration) {
        decoration.onRender(el => {
          if(!isMountedRef.current) return;
          el.innerText = command;
          el.style.color = '#00FFF4';
          el.style.opacity = '0.5';
          el.style.pointerEvents = 'none';
          el.style.fontStyle = 'italic';
        });
        decorationRef.current = decoration;
      }
    };

    // Resize handler
    const handleResize = () => {
      fitAddon.fit();
      const { cols, rows } = term;
      window.terminalAPI.resizeTerminal(cols, rows);
    };
    
    const debouncedResize = debounce(handleResize, 500);

    window.terminalAPI.onOutput((data) => {
      term.write(data);
    });
    term.onData(data => window.terminalAPI.sendInput(data));

    window.aiAPI.onSuggestedCommand((data) => {
      if (data && data.length > 0) {
        updateGhostText(data);
      }
    });

    window.terminalAPI.getTerminal();

    // Resize the terminal when the window is resized
    // This is a workaround to ensure the terminal resizes correctly
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
