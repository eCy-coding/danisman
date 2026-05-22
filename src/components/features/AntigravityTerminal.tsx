import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Logger } from '../../lib/logger';

interface AntigravityTerminalProps {
  wsUrl?: string; // Default to ws://localhost:8080
}

export const AntigravityTerminal = ({
  wsUrl = 'ws://localhost:8080',
}: AntigravityTerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    Logger.info('AntigravityTerminal: Mounting...');
    if (!terminalRef.current) {
      Logger.error('AntigravityTerminal: Ref is null!');
      return;
    }

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar', // Modern feel
      fontSize: 14,
      fontWeight: '500', // Semi-bold for clarity
      letterSpacing: 1, // Breathable text
      fontFamily: '"JetBrains Mono", "Fira Code", Menlo, monospace', // Prefer modern fonts if available
      scrollback: 5000,
      theme: {
        background: '#0d1117', // GitHub Dark Dimmed (Premium)
        foreground: '#c9d1d9', // Soft White
        cursor: '#58a6ff', // A nice blue cursor
        selectionBackground: '#3fb95040', // Subtle selection
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[32mConnected to Antigravity Terminal Service...\x1b[0m');

      // Send resize event
      const dims = { cols: term.cols, rows: term.rows };
      ws.send(JSON.stringify({ type: 'resize', ...dims }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onerror = (error) => {
      term.writeln(`\r\n\x1b[31mConnection Error: ${error}\x1b[0m`);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[33mConnection Closed.\x1b[0m');
    };

    // Terminal -> WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle Window Resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        const dims = { cols: term.cols, rows: term.rows };
        ws.send(JSON.stringify({ type: 'resize', ...dims }));
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      ws.close();
    };
  }, [wsUrl]);

  return (
    <div
      ref={terminalRef}
      data-testid="terminal"
      className="w-full h-full min-h-[400px] bg-[#1e1e1e] rounded-md overflow-hidden" // Styling
    />
  );
};
