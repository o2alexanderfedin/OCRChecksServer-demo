import type { Io } from 'functionalscript/io/module.f'
import type { Result } from 'functionalscript/types/result/module.f'

/** Extended Io type with additional methods */
export type IoE = Io & {
    readonly fetch: (url: string, options: RequestInit) => Promise<Response>
    readonly atob: (data: string) => string
    readonly log: (message: string) => void
    readonly debug: (message: string, data?: unknown) => void
    readonly warn: (message: string, data?: unknown) => void
    readonly error: (message: string, error?: unknown) => void
    readonly trace: (source: string, methodName: string, args?: unknown) => void
}

/**
 * Document types supported by OCR
 */
export enum DocumentType {
    /** Image document */
    Image = 'image',
    /** PDF document */
    PDF = 'pdf'
}

/**
 * Represents the result of an OCR operation
 */
export type OCRResult = {
    /** The extracted text content */
    text: string
    /** Confidence score of the extraction (0-1) */
    confidence: number
    /** Optional page number for multi-page documents */
    pageNumber?: number
    /** Optional bounding box for the extracted text */
    boundingBox?: {
        x: number
        y: number
        width: number
        height: number
    }
}

/**
 * Represents a document to be processed by OCR
 */
export type Document = {
    /** Content of the document (ArrayBuffer, File, Buffer, or string path) */
    content: ArrayBuffer | File | Buffer | string
    /** Type of the document */
    type: DocumentType
    /** Optional name of the document */
    name?: string
    /** Optional MIME type of the document */
    mimeType?: string
    /** Optional processing options */
    options?: {
        enhanceImage?: boolean;
        detectOrientation?: boolean;
        timeout?: number;
        forceOCR?: boolean;
    }
}

/**
 * Configuration for OCR providers
 */
export type OCRProviderConfig = {
    /** API key for the OCR service */
    apiKey: string
    /** Optional base URL for the API */
    baseUrl?: string
    /** Optional timeout in milliseconds */
    timeout?: number
}

/**
 * Interface for OCR providers
 */
export interface OCRProvider {
    /**
     * Process multiple documents in batch
     * @param documents Array of documents to process
     * @returns Promise of Result containing array of OCR results for each document
     */
    processDocuments(documents: Document[]): Promise<Result<OCRResult[][], Error>>
}

/**
 * Factory function type for creating OCR providers
 */
export type OCRProviderFactory = (io: IoE, config: OCRProviderConfig) => OCRProvider 