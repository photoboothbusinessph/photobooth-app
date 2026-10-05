import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RateLimitError } from "@/lib/security/rate-limit";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: { message: "Too many requests. Please wait and try again." } },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof ZodError) return apiError("Invalid request data.", 400, error.flatten());
  if (error instanceof Error && error.message === "Unauthorized")
    return apiError("Authentication required.", 401);
  if (error instanceof Error && error.message === "Server environment is not configured.")
    return apiError("Server services are not configured.", 503);
  console.error("API request failed", error instanceof Error ? error.message : "Unknown error");
  return apiError("The request could not be completed.", 500);
}
