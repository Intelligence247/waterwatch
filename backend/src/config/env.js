import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8050),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required (see .env.example)"),
  CLIENT_ORIGIN: z.string().url().min(1, "CLIENT_ORIGIN is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),
  EMAIL_HOST: z.string().min(1, "EMAIL_HOST is required"),
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email"),
  EMAIL_FROM_NAME: z.string().min(1, "EMAIL_FROM_NAME is required"),
  BACKEND_PUBLIC_URL: z.string().url("BACKEND_PUBLIC_URL must be a valid URL"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
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
