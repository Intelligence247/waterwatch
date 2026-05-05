import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required (see .env.example)"),
  // Browser origin for CORS in production (e.g. https://app.example.com)
  CLIENT_ORIGIN: z.string().url().optional(),
});

let cached;

export function loadEnv() {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const message = parsed.error.flatten().fieldErrors;
      throw new Error(`Invalid environment: ${JSON.stringify(message)}`);
    }
    cached = parsed.data;
  }

  return cached;
}
