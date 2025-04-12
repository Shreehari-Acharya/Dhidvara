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
      lineHeight: 1.2,
      cursorStyle: 'underline',
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
