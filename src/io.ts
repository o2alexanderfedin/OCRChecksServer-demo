export interface Io {
    readonly asyncTryCatch: <T>(fn: () => Promise<T>) => Promise<['ok', T] | ['error', unknown]>
    readonly log: (message: string) => void
}

export const workerIo: Io = {
    asyncTryCatch: async <T>(fn: () => Promise<T>) => {
        try {
            const result = await fn()
            return ['ok', result]
        } catch (error) {
            return ['error', error]
        }
    },
    log: (message: string) => console.log(message)
}

export const workerIoE = {
    ...workerIo,
    fetch: globalThis.fetch,
    atob: globalThis.atob
} 