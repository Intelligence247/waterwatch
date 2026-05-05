import { HttpError } from "./errorHandler.js";

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw new HttpError(400, "Validation failed", details);
    }

    req.validated = parsed.data;
    next();
  };
}
