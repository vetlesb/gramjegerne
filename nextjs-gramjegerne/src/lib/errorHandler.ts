import { NextResponse } from "next/server";

interface SanityError extends Error {
  statusCode?: number;
}

export function handleApiError(
  error: unknown,
  logMessage: string,
  defaultUserMessage: string,
) {
  console.error(logMessage, error);

  let statusCode = 500;
  let message = defaultUserMessage;

  if (error instanceof Error) {
    message = error.message;
    // Handle Sanity specific errors
    const sanityError = error as SanityError;
    if (sanityError.statusCode) {
      statusCode = sanityError.statusCode;
    }
  }

  return NextResponse.json(
    {
      message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
      stack:
        process.env.NODE_ENV === "development"
          ? (error as Error)?.stack
          : undefined,
    },
    { status: statusCode },
  );
}
