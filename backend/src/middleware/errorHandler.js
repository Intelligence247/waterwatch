export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err, _req, res, _next) {
  if (err?.name === "MulterError") {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof Error && err.message === "Only image files are allowed") {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err?.name === "ValidationError") {
    res.status(400).json({ error: "Validation failed", details: err.message });
    return;
  }

  if (err?.code === 11000) {
    res.status(409).json({ error: "Duplicate value detected" });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(err);

  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : message,
  });
}
