/**
 * Pure helpers for building the broker/agent signature payload posted to
 * `POST /api/contracts/[id]/agent-sign`. Kept separate from `contracts.ts`
 * so they can be unit-tested without pulling in Supabase / React Query.
 */

export class EmptySignatureError extends Error {
  constructor(message = 'empty_signature') {
    super(message);
    this.name = 'EmptySignatureError';
  }
}

/**
 * Normalize the WebView's signature export into the value the backend
 * stores on `contracts.agent_signature_png`.
 *
 * Backend contract (WebCRM `/agent-sign` route):
 *   - Reads `signatureData` from the JSON body.
 *   - Trims it and rejects with `missing_signature` if length < 32.
 *   - Stores the value verbatim (so a data URL stays a data URL).
 *
 * Mobile renders the stored value with `<Image source={{ uri }} />`, so we
 * always send a `data:image/png;base64,…` form regardless of whether the
 * caller passed the raw base64 or a full data URL.
 *
 * Returns `null` when the input is empty / shorter than the backend's
 * threshold, so the caller can surface a local validation message instead
 * of forwarding to the server only to see `missing_signature`.
 */
export function buildAgentSignaturePayload(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const dataUrl = trimmed.startsWith('data:')
    ? trimmed
    : `data:image/png;base64,${trimmed}`;

  if (dataUrl.length < 32) return null;

  return dataUrl;
}
