 

import WebSocket from 'ws';

// Configuration
const PORT = 8080;
const URL = `ws://localhost:${PORT}`;

function testRepl(language: 'node' | 'python', promptParams: { cmd: string, prompt: string, input: string, output: string }): Promise<void> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(URL);
        let stage = 'CONNECT'; // CONNECT -> PROMPT_WAIT -> INPUT_SENT -> OUTPUT_WAIT -> DONE
        let buffer = '';

        console.log(`\n--- Testing ${language.toUpperCase()} REPL ---`);

        const timeout = setTimeout(() => {
            console.error(`[TIMEOUT] ${language} test failed at stage: ${stage}`);
            ws.close();
            reject(new Error('Timeout'));
        }, 10000);

        ws.on('open', () => {
            console.log(`[${language}] Connected`);
            // Wait a moment for shell prompt, then start REPL
            setTimeout(() => {
                console.log(`[${language}] Starting REPL: ${promptParams.cmd}`);
                ws.send(`${promptParams.cmd}\r`);
                stage = 'PROMPT_WAIT';
            }, 1000);
        });

        ws.on('message', (data) => {
            const str = data.toString();
            // console.log(`[${language} RAW]`, JSON.stringify(str));
            buffer += str;

            if (stage === 'PROMPT_WAIT') {
                 // Check if REPL prompt appeared
                 if (buffer.includes(promptParams.prompt)) {
                     console.log(`[${language}] Prompt detected. Sending code: ${promptParams.input}`);
                     buffer = ''; // Clear buffer to catch fresh output
                     ws.send(`${promptParams.input}\r`);
                     stage = 'OUTPUT_WAIT';
                 }
            } else if (stage === 'OUTPUT_WAIT') {
                if (buffer.includes(promptParams.output)) {
                    console.log(`[${language}] SUCCESS: Output '${promptParams.output}' received.`);
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                }
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function run() {
    try {
        // Test Node.js
        // > 2 + 2 
        // 4
        await testRepl('node', {
            cmd: 'node',
            prompt: '>',
            input: '2 + 2',
            output: '4'
        });

        // Test Python
        // >>> print("Polyglot")
        // Polyglot
        await testRepl('python', {
            cmd: 'python3',
            prompt: '>>>',
            input: 'print("Polyglot")',
            output: 'Polyglot'
        });

        console.log('\nAll Polyglot Tests PASSED ✅');
        process.exit(0);
    } catch (e) {
        console.error('\nPolyglot Tests FAILED ❌', e);
        process.exit(1);
    }
}

run();
