 

import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Connected to server');
    // Send command quickly
    setTimeout(() => {
        console.log('Sending command: echo "ANTIGRAVITY_CHECK"');
        ws.send('echo "ANTIGRAVITY_CHECK"\r');
    }, 500);
});

ws.on('message', (data) => {
    const str = data.toString();
    console.log('Received:', JSON.stringify(str));
    
    if (str.includes('Warning: PTY native module failed') || str.includes('Using Python PTY bridge')) {
        console.warn('SERVER IS IN FALLBACK MODE (Expected: Python PTY). Continuing...');
    }
    
    if (str.includes('ANTIGRAVITY_CHECK')) {
        console.log('SUCCESS: Echo received');
        ws.close();
        process.exit(0);
    }
});

ws.on('error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log(`Connection closed: ${code} ${reason}`);
    // If we haven't succeeded yet, this is bad
    if (!process.exitCode) {
         console.error('Closed before success');
         process.exit(1);
    }
});
