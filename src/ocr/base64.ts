/**
 * Cross-platform utility functions for handling base64 encoding and Buffer operations
 * Works in Node.js, browsers, and Cloudflare Workers
 */

// Polyfill Buffer for environments that don't have it (like Cloudflare Workers)
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  (globalThis.Buffer as any) = {
    from: (data: string | Uint8Array, encoding?: string) => {
      // Simple implementation that supports string->base64 and Uint8Array->base64
      return {
        toString: (encoding: string) => {
          if (encoding === 'base64') {
            if (typeof data === 'string') {
              return btoa(data);
            } else if (data instanceof Uint8Array) {
              const binary = Array.from(data)
                .map(b => String.fromCharCode(b))
                .join('');
              return btoa(binary);
            }
          }
          return String(data);
        },
        byteLength: typeof data === 'string' ? data.length : data.byteLength || 0
      };
    },
    isBuffer: (obj: any): boolean => false
  };
}

/**
 * Checks if an object is a Buffer
 * @param obj Object to check
 * @returns True if the object is a Buffer
 */
export function isBuffer(obj: any): obj is Buffer {
  return Buffer.isBuffer?.(obj) || false;
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
    // For string paths, we return the string length
    return content.length;
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
    // This would normally need to be asynchronous, but for now return an empty buffer
    return new ArrayBuffer(0);
  } else {
    // For string paths, we return an empty buffer for now
    return new ArrayBuffer(0);
  }
}

/**
 * Converts string to base64
 * @param str String to convert
 * @returns Base64 encoded string
 */
export function stringToBase64(str: string): string {
  const buffer = Buffer.from(str);
  return buffer.toString('base64');
}

/**
 * Converts ArrayBuffer to base64 string
 * @param arrayBuffer The ArrayBuffer to convert
 * @returns Base64 string representation of the ArrayBuffer
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  // Convert ArrayBuffer to Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Use the standard Buffer pattern
  const buffer = Buffer.from(uint8Array);
  return buffer.toString('base64');
}

/**
 * Converts base64 string to Buffer-like object
 * @param base64 Base64 string
 * @returns Buffer-like object
 */
export function base64ToBuffer(base64: string): any {
  return Buffer.from(base64, 'base64');
}