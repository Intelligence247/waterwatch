import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function signAccessToken(payload, env) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function signRefreshToken(payload, env) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token, env) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token, env) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
