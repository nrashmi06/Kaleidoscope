/**
 * Parse a backend timestamp as UTC.
 *
 * The backend returns naive datetime strings (no timezone suffix),
 * e.g. "2026-04-15T19:00:53.41959". JavaScript's `new Date()` treats
 * these as **local time**, but the backend stores them as UTC.
 * Appending "Z" forces correct UTC interpretation.
 */
export function parseUTC(timestamp: string): Date {
  if (!timestamp) return new Date();
  return new Date(timestamp.endsWith("Z") ? timestamp : timestamp + "Z");
}
