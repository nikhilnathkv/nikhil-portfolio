'use client';

import { AdminApiError, SessionExpiredError } from '@/lib/admin/client-api';

/**
 * Upload a file to the admin proxy with real progress. Uses XMLHttpRequest
 * (fetch has no upload-progress events) and unwraps the `{data}` envelope.
 */
export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin${path}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 401) return reject(new SessionExpiredError());
      let payload: unknown = {};
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      const p = payload as { data?: T; error?: { code: string; message: string } };
      if (xhr.status >= 200 && xhr.status < 300 && p.data !== undefined) {
        resolve(p.data);
      } else {
        reject(
          new AdminApiError(
            xhr.status,
            p.error ?? { code: 'UPLOAD_ERROR', message: 'Upload failed' },
          ),
        );
      }
    };
    xhr.onerror = () =>
      reject(new AdminApiError(0, { code: 'NETWORK_ERROR', message: 'Network error' }));

    xhr.send(form);
  });
}
