export const BOOTH_SESSION_DURATION_SECONDS = 120;
export const BOOTH_SESSION_DEADLINE_KEY = "jjnjj-booth-session-deadline";
export const BOOTH_SESSION_VOICE_WARNINGS_KEY = "jjnjj-booth-session-voice-warnings";

export function createBoothSessionDeadline() {
  return Date.now() + BOOTH_SESSION_DURATION_SECONDS * 1000;
}
