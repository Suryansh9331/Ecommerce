/**
 * Pull the most useful message out of a failed API response.
 *
 * The backend is inconsistent about the key it uses — controllers return
 * `{ message }`, the global error handlers return `{ message, error, type }`,
 * some routes return `{ error }` or a plain string — and a 502/504 from the
 * proxy is not JSON at all. Reading only `data.message` therefore silently
 * falls back to a useless hardcoded string. Use this instead:
 *
 *   if (!response.ok) throw new Error(await extractApiError(response, 'Failed to save'));
 */
export async function extractApiError(
  response: Response,
  fallback = 'Request failed'
): Promise<string> {
  let raw = '';
  try {
    raw = await response.text();
  } catch {
    return `${fallback} (HTTP ${response.status} ${response.statusText}).`;
  }

  if (raw) {
    try {
      const data = JSON.parse(raw);
      const message =
        data?.message ??
        data?.error ??
        data?.msg ??
        data?.detail ??
        (Array.isArray(data?.errors) ? data.errors.join(', ') : undefined);

      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
      if (message && typeof message === 'object') {
        // e.g. marshmallow style { field: ["is required"] }
        const parts = Object.entries(message).map(
          ([field, detail]) =>
            `${field}: ${Array.isArray(detail) ? detail.join(', ') : String(detail)}`
        );
        if (parts.length) return parts.join(' | ');
      }
    } catch {
      // Not JSON — an HTML error page or plain text from the proxy/gateway.
      const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text) return `${fallback} (HTTP ${response.status}): ${text.slice(0, 200)}`;
    }
  }

  if (response.status === 401) return 'Your session has expired. Please sign in again.';
  if (response.status === 403) return 'You do not have permission to perform this action.';
  if (response.status === 413) return 'The uploaded file is too large.';
  if (response.status >= 500) {
    return `${fallback}: the server returned an error (HTTP ${response.status}). Please try again or contact support if it keeps happening.`;
  }
  return `${fallback} (HTTP ${response.status} ${response.statusText}).`;
}

/** Message for a thrown error (network failure, aborted fetch, thrown Error). */
export function describeError(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof TypeError) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}
