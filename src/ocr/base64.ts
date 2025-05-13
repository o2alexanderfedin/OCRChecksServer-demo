/**
 * Cross-platform utility functions for handling base64 encoding and Buffer operations
 * Works in Node.js, browsers, and Cloudflare Workers
 */

// Detect available Buffer implementations
const getBufferImpl = () => {
  // Check global Buffer first (Node.js)
  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer;
  }
  
  // Define polyfill for environments without Buffer
  if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
    // Simple polyfill for environments without Buffer
    // We need to cast to any because we're not implementing the full Buffer interface
    (globalThis.Buffer as any) = {
      from: (data: Uint8Array | string) => {
        return {
          toString: (encoding: string) => {
            if (encoding === 'base64' && typeof data === 'string') {
              return btoa(data);
            }
            if (encoding === 'base64' && data instanceof Uint8Array) {
              const binary = Array.from(data)
                .map(b => String.fromCharCode(b))
                .join('');
              return btoa(binary);
            }
            return '';
          },
          byteLength: data.length || 0
        };
      },
      isBuffer: (obj: any): boolean => false
    };
    return globalThis.Buffer;
  }
  
  // Try to require buffer module (Node.js)
  try {
    const bufferModule = require('buffer');
    return bufferModule.Buffer;
  } catch (e) {
    // Not Node.js or require not available
    return null;
  }
};

const BufferImpl = getBufferImpl();

/**
 * Checks if an object is a Buffer
 * @param obj Object to check
 * @returns True if the object is a Buffer
 */
export function isBuffer(obj: any): obj is Buffer {
  // Use Buffer.isBuffer if available
  if (BufferImpl && typeof BufferImpl.isBuffer === 'function') {
    return BufferImpl.isBuffer(obj);
  }
  
  // Check global Buffer as fallback
  if (globalThis.Buffer && typeof globalThis.Buffer.isBuffer === 'function') {
    return globalThis.Buffer.isBuffer(obj);
  }
  
  return false;
}

/**
 * Gets the byte length of various content types
 * @param content The content (ArrayBuffer, File, Buffer, or string path)
 * @returns The byte length or -1 if can't be determined
 */
export function getContentByteLength(content: ArrayBuffer | File | any | string): number {
  if (content instanceof ArrayBuffer) {
    return content.byteLength;
  } else if (typeof content === 'string') {
    // For string paths, we return a placeholder size
    return -1;
  } else if (content instanceof File) {
    return content.size;
  } else if (isBuffer(content)) {
    return content.byteLength;
  }
  return -1;
}

/**
 * Converts content to ArrayBuffer
 * @param content The content (ArrayBuffer, File, Buffer, or string path)
 * @returns ArrayBuffer
 */
export function contentToArrayBuffer(content: ArrayBuffer | File | any | string): ArrayBuffer {
  if (content instanceof ArrayBuffer) {
    return content;
  } else if (isBuffer(content)) {
    return content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength
    );
  } else if (content instanceof File) {
    // This would normally need to be asynchronous, but for now just return an empty buffer
    return new ArrayBuffer(0);
  } else {
    // For string paths, we return an empty buffer for now
    return new ArrayBuffer(0);
  }
}

/**
 * Converts ArrayBuffer to base64 string
 * Works in any environment (Node.js, browser, Cloudflare Workers)
 * @param arrayBuffer The ArrayBuffer to convert
 * @returns Base64 string representation of the ArrayBuffer
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  // Convert ArrayBuffer to Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);
  
  try {
    // Try using Buffer from our implementation first
    if (BufferImpl) {
      const buffer = BufferImpl.from(uint8Array);
      return buffer.toString('base64');
    }
    
    // Try global Buffer next
    if (globalThis.Buffer && typeof globalThis.Buffer.from === 'function') {
      const buffer = globalThis.Buffer.from(uint8Array);
      return buffer.toString('base64');
    }
    
    // Fallback to browser's btoa if available
    if (typeof btoa === 'function') {
      const binary = Array.from(uint8Array)
        .map(b => String.fromCharCode(b))
        .join('');
      return btoa(binary);
    }
    
    throw new Error('No Base64 encoding method available');
  } catch (error) {
    // Final fallback - try one more time with btoa
    if (typeof btoa === 'function') {
      try {
        const binary = Array.from(uint8Array)
          .map(b => String.fromCharCode(b))
          .join('');
        return btoa(binary);
      } catch {
        // Ignore errors in the final fallback
      }
    }
    
    throw new Error(`Failed to convert ArrayBuffer to base64: ${error}`);
  }
}