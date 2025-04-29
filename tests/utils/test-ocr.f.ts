import { processCheckImage } from './src/ocr.f.js';
import type { Io } from 'functionalscript/io/module.f.js';
import type { Result } from 'functionalscript/types/result/module.f.js';

type IoE = Io & {
    readonly fetch: ((url: string) => Promise<Response>) & ((url: string, options: RequestInit) => Promise<Response>)
    readonly atob: (data: string) => string
}

// Mock implementation of IoE
const mockIo: IoE = {
    fetch: ((url: string, options?: RequestInit) => {
        if (!options) {
            throw new Error('Options are required');
        }
        if (url !== 'https://api.mistral.ai/v1/chat/completions') {
            throw new Error('Unexpected URL');
        }
        if (options.method !== 'POST') {
            throw new Error('Unexpected method');
        }
        const headers = new Headers(options.headers);
        if (headers.get('Content-Type') !== 'application/json') {
            throw new Error('Unexpected content type');
        }
        if (!headers.get('Authorization')?.startsWith('Bearer ')) {
            throw new Error('Unexpected authorization header');
        }

        // Mock successful response
        return Promise.resolve(new Response(JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        amount: '100.00',
                        date: '04/22/2024',
                        payee: 'Test Payee',
                        memo: 'Test Memo'
                    })
                }
            }]
        })));
    }) as IoE['fetch'],
    atob: (data: string) => data,
    console: {
        log: console.log,
        error: console.error
    },
    fs: {
        writeFileSync: () => {},
        readFileSync: () => null,
        existsSync: () => false,
        promises: {
            readFile: async () => '',
            writeFile: async () => {},
            readdir: async () => [],
            rm: async () => {},
            mkdir: async () => undefined,
            copyFile: async () => {}
        }
    },
    process: {
        argv: [],
        env: {},
        exit: () => { throw new Error('exit called') },
        cwd: () => ''
    },
    asyncImport: async () => ({ default: {} }),
    performance: {
        now: () => 0
    },
    tryCatch: <T>(f: () => T): Result<T, unknown> => {
        try {
            return ['ok', f()];
        } catch (error) {
            return ['error', error];
        }
    },
    asyncTryCatch: async <T>(f: () => Promise<T>): Promise<Result<T, unknown>> => {
        try {
            return ['ok', await f()];
        } catch (error) {
            return ['error', error];
        }
    }
};

async function testProcessCheckImage(): Promise<void> {
    try {
        // Create a mock image buffer (just some bytes)
        const mockImage = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
        const mockApiKey = 'test-api-key';

        console.log('Testing processCheckImage with valid input...');
        const result = await processCheckImage(mockIo, mockImage.buffer, mockApiKey);
        console.log('Result:', result);

        // Verify the result has the expected structure
        if (!result.amount || !result.date || !result.payee || !result.memo) {
            throw new Error('Result missing required fields');
        }

        console.log('Test passed!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testProcessCheckImage(); 