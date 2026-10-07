import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RateLimitError } from "@/lib/security/rate-limit";
import { MongoServerError } from "mongodb";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json({ data }, { ...init, headers });
}

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function handleApiError(error: unknown) {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: { message: "Too many requests. Please wait and try again." } },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof ZodError) return apiError("Invalid request data.", 400, error.flatten());
  if (error instanceof MongoServerError && error.code === 11000) return apiError("This value is already in use.", 409);
  if (error instanceof Error && error.message === "Unauthorized")
    return apiError("Authentication required.", 401);
  if (error instanceof Error && error.message === "Forbidden")
    return apiError("Access denied.", 403);
  if (error instanceof Error && error.message === "Server environment is not configured.")
    return apiError("Server services are not configured.", 503);
  console.error("API request failed", error instanceof Error ? error.name : "Unknown error");
  return apiError("The request could not be completed.", 500);
}
