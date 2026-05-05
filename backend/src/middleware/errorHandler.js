export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(err);

  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : message,
  });
}
