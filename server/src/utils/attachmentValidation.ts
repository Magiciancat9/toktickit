/**
 * Attachment validation rules (fixed by spec):
 *   - Allowed MIME types: JPG/JPEG, PNG, WEBP, PDF
 *   - Maximum file size: 5 MB
 *   - Maximum active attachments per ticket: 5
 */

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ACTIVE_ATTACHMENTS = 5;

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function isAllowedFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES;
}
