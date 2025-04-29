import type { Result } from 'functionalscript/types/result/module.f.js'
import type { IoE } from '../ocr/types'

/**
 * Result of JSON extraction
 */
export type JsonExtractionResult = {
    /** Extracted JSON data */
    json: any;
    /** Confidence score (0-1) indicating extraction reliability */
    confidence: number;
}

/**
 * JSON Schema type definition for Mistral API
 */
export type JsonSchema = {
    name: string;
    description?: string | null;
    schemaDefinition: {
        [key: string]: any;
    };
    strict?: boolean;
};

/**
 * Request for JSON extraction
 */
export type JsonExtractionRequest = {
    /** Markdown text to process */
    markdown: string;
    /** Optional JSON schema to validate against */
    schema?: JsonSchema;
    /** Optional extraction options */
    options?: {
        /** Whether to throw an error or return partial results on validation failure */
        strictValidation?: boolean;
    };
}

/**
 * JSON extractor interface
 */
export interface JsonExtractor {
    /**
     * Extract structured JSON data from markdown text
     * @param request The extraction request
     * @returns Promise of Result containing extraction result
     */
    extract(request: JsonExtractionRequest): Promise<Result<JsonExtractionResult, Error>>;
}