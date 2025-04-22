import type { Io } from 'functionalscript/io/module.f.js'
import type { Result } from 'functionalscript/types/result/module.f.js'

/** Extended Io type with additional methods */
export type IoE = Io & {
    readonly fetch: (url: string, options: RequestInit) => Promise<Response>
    readonly atob: (data: string) => string
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
    /** Binary content of the document */
    content: ArrayBuffer
    /** Type of the document */
    type: 'image' | 'pdf'
    /** Optional name of the document */
    name?: string
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