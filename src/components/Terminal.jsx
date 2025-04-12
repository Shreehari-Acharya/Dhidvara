import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export default function TerminalComponent() {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 18,
      theme: {
        background: '#0f172a', // Tailwind slate-900
        foreground: '#f8fafc', // Tailwind slate-50
        cursor: '#38bdf8',     // Tailwind sky-400
        selection: '#1e293b',  // Tailwind slate-800
        black: '#1e293b',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#f472b6',
        cyan: '#2dd4bf',
        white: '#f4f4f5',
        brightBlack: '#6b7280',
        brightRed: '#fb7185',
        brightGreen: '#86efac',
        brightYellow: '#fde68a',
        brightBlue: '#93c5fd',
        brightMagenta: '#f9a8d4',
        brightCyan: '#5eead4',
        brightWhite: '#ffffff',
      },
    });
    const fitAddon = new FitAddon();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
        fitAddon.fit();


    window.terminalAPI.onOutput((data) => term.write(data) );
    term.onData(data => window.terminalAPI.sendInput(data));

    window.terminalAPI.getTerminal();

    // Resize the terminal when the window is resized
    // This is a workaround to ensure the terminal resizes correctly
    window.addEventListener('resize', () => {

      // Fit the terminal to the container
      fitAddon.fit(); 

      // Send the new size to the main process
      const { cols, rows } = term;
      window.terminalAPI.resizeTerminal(cols, rows);
    });

    return () => {
      term.dispose();
      window.removeEventListener('resize', () => {
        fitAddon.fit();
        const { cols, rows } = term;
        window.terminalAPI.resizeTerminal(cols, rows);
      });
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full bg-blue-400" />;
}
