import { HttpErrorResponse } from '@angular/common/http';

export interface ApiResponse<T> {
  data: T | null;
  hasError: boolean;
  errorType: string | null;
  message: string | null;
  errors: Record<string, string[]> | null;
}

export function unwrapApiResponse<T>(response: ApiResponse<T>, fallback: string): T {
  if (response.hasError || response.data === null) {
    throw new Error(response.message ?? fallback);
  }

  return response.data;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    return getErrorPayloadMessage(error.error, fallback);
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function getErrorPayloadMessage(errorBody: unknown, fallback: string): string {
  if (!isErrorPayload(errorBody)) {
    return fallback;
  }

  const fieldErrors = errorBody.errors ? Object.values(errorBody.errors).flat() : [];
  const messages = [
    errorBody.message,
    errorBody.title,
    ...fieldErrors
  ].filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join(' ') : fallback;
}

function isErrorPayload(value: unknown): value is {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
} {
  return typeof value === 'object' && value !== null;
}
