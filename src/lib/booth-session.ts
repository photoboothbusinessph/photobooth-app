export const DEFAULT_BOOTH_SESSION_DURATION_SECONDS = 120;
export const MIN_BOOTH_SESSION_DURATION_SECONDS = 60;
export const MAX_BOOTH_SESSION_DURATION_SECONDS = 60 * 60;
export const BOOTH_SESSION_DEADLINE_KEY = "receipt-booth-session-deadline";
export const BOOTH_SESSION_VOICE_WARNINGS_KEY = "receipt-booth-session-voice-warnings";

export function normalizeBoothSessionDurationSeconds(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isInteger(value)) return DEFAULT_BOOTH_SESSION_DURATION_SECONDS;
  return Math.min(MAX_BOOTH_SESSION_DURATION_SECONDS, Math.max(MIN_BOOTH_SESSION_DURATION_SECONDS, value));
}

export function createBoothSessionDeadline(durationSeconds = DEFAULT_BOOTH_SESSION_DURATION_SECONDS) {
  return Date.now() + normalizeBoothSessionDurationSeconds(durationSeconds) * 1000;
}
