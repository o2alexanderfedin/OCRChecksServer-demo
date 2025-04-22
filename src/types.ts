export interface Env {
  MISTRAL_API_KEY: string;
}

declare global {
  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
} 