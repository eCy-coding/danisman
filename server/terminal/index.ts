/* eslint-disable no-console */
import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import * as os from 'os';
import * as fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export function setupTerminalServer(port: number) {
  const wss = new WebSocketServer({ port });

  console.log(`Antigravity Terminal Server started on port ${port}`);

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to terminal');

    let shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');
    if (os.platform() !== 'win32' && !fs.existsSync(shell)) {
        console.warn(`[WARN] Shell ${shell} not found. Trying /bin/zsh`);
        shell = '/bin/zsh';
        if (!fs.existsSync(shell)) {
            console.warn(`[WARN] Shell ${shell} not found. Trying /bin/sh`);
            shell = '/bin/sh';
        }
    }

    const cwd = process.env.HOME || process.cwd();

    // console.log(`[DEBUG] Final selection for PTY: shell='${shell}', cwd='${cwd}'`);
    
    let ptyProcess: pty.IPty | null = null;
    let childProcess: ChildProcessWithoutNullStreams | null = null;

    try {
        try {
            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: cwd,
                env: process.env as Record<string, string>
            });
            
            // Send data from pty to client
            ptyProcess.onData((data: string) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });
            
            ptyProcess.onExit(({ exitCode, signal }) => {
                 console.log(`Pty exited with code ${exitCode} signal ${signal}`);
                 ws.close();
            });

        } catch (ptyError) {
            console.error('Failed to spawn pty, falling back to child_process wrapper:', ptyError);
            ws.send(`\r\n\x1b[33mWarning: PTY native module failed. Using Python PTY bridge for emulation.\x1b[0m\r\n`);
            
            // Ultimate Fallback: Use python3 pty module to bridge the gap
            // python3 -c "import pty; pty.spawn('/bin/zsh')"
            const pythonCmd = 'python3';
            const pythonArgs = ['-u', '-c', `import pty; pty.spawn('${shell}')`];

            // console.log(`[DEBUG] Spawning Python PTY bridge: ${pythonCmd} ${pythonArgs.join(' ')}`);

            childProcess = spawn(pythonCmd, pythonArgs, {
                cwd: cwd,
                env: { ...process.env, TERM: 'xterm-256color' },
                shell: false
            });
            
            childProcess.stdout.on('data', (data) => {
                if (ws.readyState === WebSocket.OPEN) ws.send(data);
            });
            childProcess.stderr.on('data', (data) => {
                if (ws.readyState === WebSocket.OPEN) ws.send(data);
            });
            
            childProcess.on('exit', (code, signal) => {
                 console.log(`Process exited with code ${code} signal ${signal}`);
                 ws.close();
            });
        }

        // Receive data from client and write to process
        ws.on('message', (message: unknown) => {
          try {
            const msgStr = typeof message === 'string' ? message : (message as Buffer).toString();
            const parsed = JSON.parse(msgStr);
            // Resize only works for PTY
            if (ptyProcess && parsed.type === 'resize' && parsed.cols && parsed.rows) {
                 ptyProcess.resize(parsed.cols, parsed.rows);
                 return;
            }
            // If fallback, ignore resize or handle other events
            
            if (ptyProcess) {
                ptyProcess.write(msgStr);
            } else if (childProcess) {
                childProcess.stdin.write(msgStr);
            }
          } catch {
             const msgStr = typeof message === 'string' ? message : (message as Buffer).toString();
             if (ptyProcess) {
                ptyProcess.write(msgStr);
             } else if (childProcess) {
                childProcess.stdin.write(msgStr);
             }
          }
        });

        ws.on('close', () => {
          console.log('Client disconnected, killing process');
          try { 
              if (ptyProcess) ptyProcess.kill();
              if (childProcess) childProcess.kill();
          } catch (e) { console.error('Error killing process:', e); }
        });

    } catch (err) {
      console.error('Fatal error in terminal connection:', err);
      ws.send(`\r\n\x1b[31mFatal Error: ${err}\x1b[0m`);
      ws.close();
    }
  });

  return wss;
}
