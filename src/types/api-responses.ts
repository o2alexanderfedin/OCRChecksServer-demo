/**
 * Type definitions for API responses
 * 
 * This file defines TypeScript types for the OCR API responses.
 */

import type { Check } from '../json/schemas/check.ts';
import type { Receipt } from '../json/schemas/receipt.ts';

/**
 * Common confidence scores included in all OCR responses
 */
export interface ConfidenceScores {
  /** OCR text recognition confidence (0-1) */
  ocr: number;
  /** Data extraction confidence (0-1) */
  extraction: number;
  /** Overall combined confidence score (0-1) */
  overall: number;
}

/**
 * Base response interface that all OCR responses extend
 */
export interface BaseOCRResponse<T> {
  /** Extracted data in structured format */
  data: T;
  /** Confidence scores for the processing */
  confidence: ConfidenceScores;
}

/**
 * Check OCR response type
 * 
 * Returned by the /check endpoint when processing check images
 */
export interface CheckOCRResponse extends BaseOCRResponse<Check> {
  /** Check-specific data */
  data: Check;
}

/**
 * Receipt OCR response type
 * 
 * Returned by the /receipt endpoint when processing receipt images
 */
export interface ReceiptOCRResponse extends BaseOCRResponse<Receipt> {
  /** Receipt-specific data */
  data: Receipt;
}

/**
 * Universal document processing response
 * 
 * Returned by the /process endpoint which can handle multiple document types
 */
export interface ProcessDocumentResponse extends BaseOCRResponse<Check | Receipt> {
  /** Type of document that was processed */
  documentType: 'check' | 'receipt';
}

/**
 * Error response
 * 
 * Returned when there's an error processing the document
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** Optional hint for resolving the issue */
  hint?: string;
}

/**
 * Health check response
 * 
 * Returned by the /health endpoint
 */
export interface HealthResponse {
  /** Status of the service */
  status: 'ok' | 'error';
  /** 
   * Timestamp when the health check was performed
   * 
   * @type ISO 8601 formatted date-time string stored as JavaScript Date object
   * Serialized using toISOString() when sent in responses
   */
  timestamp: Date;
  /** Version of the API */
  version: string;
  /** Mistral API key status */
  mistralApiKeyStatus?: {
    /** Whether the Mistral API key is configured */
    configured: boolean;
    /** Brief message about the API key status */
    message: string;
  };
}