export interface Io {
    readonly asyncTryCatch: <T>(fn: () => Promise<T>) => Promise<['ok', T] | ['error', unknown]>
    readonly log: (message: string) => void
    readonly debug: (message: string, data?: any) => void
    readonly warn: (message: string, data?: any) => void
    readonly error: (message: string, error?: any) => void
    readonly trace: (source: string, methodName: string, args?: any) => void
}

// Generate a unique request ID for tracing
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// Current request ID - will be set at the beginning of each request
let currentRequestId = generateRequestId();

// Reset request ID for a new request
export const resetRequestId = () => {
    currentRequestId = generateRequestId();
    return currentRequestId;
};

// Get current request ID
export const getRequestId = () => currentRequestId;

// Format log message with timestamp and request ID
const formatLogMessage = (level: string, message: string) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${currentRequestId}] ${message}`;
};

// Format error object for logging
const formatError = (error: any): string => {
    if (!error) return 'undefined';
    
    try {
        if (error instanceof Error) {
            return JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack,
                // Include additional properties that might be present in API errors
                ...(error as any)
            }, null, 2);
        }
        return JSON.stringify(error, null, 2);
    } catch (e) {
        return `[Unserializable Error]: ${String(error)}`;
    }
};

export const workerIo: Io = {
    asyncTryCatch: async <T>(fn: () => Promise<T>) => {
        try {
            console.log(formatLogMessage('TRACE', `Starting async operation`));
            const startTime = Date.now();
            const result = await fn();
            const duration = Date.now() - startTime;
            console.log(formatLogMessage('TRACE', `Completed async operation in ${duration}ms`));
            return ['ok', result];
        } catch (error) {
            console.error(formatLogMessage('ERROR', `Async operation failed: ${formatError(error)}`));
            return ['error', error];
        }
    },
    log: (message: string) => console.log(formatLogMessage('INFO', message)),
    debug: (message: string, data?: any) => {
        if (data) {
            console.debug(formatLogMessage('DEBUG', `${message}: ${JSON.stringify(data, null, 2)}`));
        } else {
            console.debug(formatLogMessage('DEBUG', message));
        }
    },
    warn: (message: string, data?: any) => {
        if (data) {
            console.warn(formatLogMessage('WARN', `${message}: ${JSON.stringify(data, null, 2)}`));
        } else {
            console.warn(formatLogMessage('WARN', message));
        }
    },
    error: (message: string, error?: any) => {
        if (error) {
            console.error(formatLogMessage('ERROR', `${message}: ${formatError(error)}`));
        } else {
            console.error(formatLogMessage('ERROR', message));
        }
    },
    trace: (source: string, methodName: string, args?: any) => {
        const argsString = args ? ` with args: ${JSON.stringify(args, null, 2)}` : '';
        console.log(formatLogMessage('TRACE', `${source}.${methodName} called${argsString}`));
    }
};

// Enhanced version with fetch and encoding methods
export const workerIoE = {
    ...workerIo,
    fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = input.toString();
        const method = init?.method || 'GET';
        
        workerIo.debug(`Making ${method} request to ${url}`, {
            headers: init?.headers,
            bodySize: init?.body ? (init.body instanceof ArrayBuffer ? 
                `ArrayBuffer(${(init.body as ArrayBuffer).byteLength} bytes)` : 
                `${String(init.body).substring(0, 100)}...`
            ) : 'none'
        });
        
        const startTime = Date.now();
        
        try {
            const response = await globalThis.fetch(input, init);
            const duration = Date.now() - startTime;
            
            // Convert headers to simple object
            const headersObj: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headersObj[key] = value;
            });
            
            workerIo.debug(`Received response from ${url} in ${duration}ms`, {
                status: response.status,
                statusText: response.statusText,
                headers: headersObj
            });
            
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            workerIo.error(`Fetch to ${url} failed after ${duration}ms`, error);
            throw error;
        }
    },
    atob: (data: string): string => {
        workerIo.trace('workerIoE', 'atob', { dataLength: data.length });
        try {
            return globalThis.atob(data);
        } catch (error) {
            workerIo.error('Base64 decoding failed', error);
            throw error;
        }
    }
};