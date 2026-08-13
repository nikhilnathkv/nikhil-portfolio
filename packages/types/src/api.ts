/**
 * API response envelope — the single response contract for the whole API.
 *
 * Success:
 *   { "data": {...}, "meta": {...} }
 * Error:
 *   { "error": { "code": "PROJECT_NOT_FOUND", "message": "Project not found" } }
 */

export interface ApiMeta {
  /** Total number of records available (for paginated collections). */
  total?: number;
  /** Current page (1-indexed). */
  page?: number;
  /** Page size. */
  pageSize?: number;
  [key: string]: unknown;
}

export interface ApiSuccess<TData> {
  data: TData;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  /** Optional field-level validation details. */
  details?: Record<string, string[]>;
}

export interface ApiError {
  error: ApiErrorBody;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;

export function isApiError<TData>(response: ApiResponse<TData>): response is ApiError {
  return (response as ApiError).error !== undefined;
}
