import { z } from "zod";

const clientOriginSchema = z.string().min(1, "CLIENT_ORIGIN is required").refine((value) => {
  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!origins.length) return false;

  return origins.every((origin) => z.string().url().safeParse(origin).success);
}, "CLIENT_ORIGIN must be a comma-separated list of valid URLs");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8050),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required (see .env.example)"),
  CLIENT_ORIGIN: clientOriginSchema,
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  WATERPOINT_MIN_DISTANCE_METERS: z.coerce.number().int().min(1).max(500).default(10),
  WATERPOINT_REVIEW_DISTANCE_METERS: z.coerce.number().int().min(1).max(2000).default(30),
  WATERPOINT_AUDIT_DISTANCE_METERS: z.coerce.number().int().min(1).max(2000).default(50),
  // Optional at app boot; validated by email service when used.
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email").optional(),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required").optional(),
  EMAIL_HOST: z.string().min(1, "EMAIL_HOST is required").optional(),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email").optional(),
  EMAIL_FROM_NAME: z.string().min(1, "EMAIL_FROM_NAME is required").optional(),
  BACKEND_PUBLIC_URL: z.string().url("BACKEND_PUBLIC_URL must be a valid URL").optional(),
  // Optional at app boot; validated by upload service when used.
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required").optional(),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required").optional(),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required").optional(),
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
