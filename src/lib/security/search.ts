/**
 * Search input is passed to PostgREST's filter syntax, where `,` and `()`
 * separate filters and operators. Strip those characters (plus wildcards) so a
 * visitor cannot inject additional filters, then cap the length.
 */
export function sanitizeSearchTerm(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/[^\p{L}\p{N}\s@.+'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

/** Escape a value used inside a PostgREST `or(...)` expression. */
export function toPostgrestPattern(term: string): string {
  const safe = sanitizeSearchTerm(term);
  return `%${safe}%`;
}
