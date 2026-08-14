export interface Media {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  created_at: string;
}

export interface MediaUsageItem {
  kind: string;
  label: string;
  slug: string | null;
}

export interface MediaUsage {
  count: number;
  items: MediaUsageItem[];
}

/** Accepted upload types — images + PDF (mirrors the API allowlist). */
export const ACCEPTED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
] as const;

export const ACCEPT_ATTR = ACCEPTED_MIME.join(',');
export const MAX_UPLOAD_MB = 10;

export const isImage = (mime: string): boolean => mime.startsWith('image/');

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
