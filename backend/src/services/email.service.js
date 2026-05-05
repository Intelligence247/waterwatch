import nodemailer from "nodemailer";
import { loadEnv } from "../config/env.js";

let transporter;

function getTransporter() {
  if (!transporter) {
    const env = loadEnv();
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail({ to, fullName, verificationUrl }) {
  const env = loadEnv();
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject: "Verify your WaterWatch account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to WaterWatch</h2>
        <p>Hello ${fullName},</p>
        <p>Thanks for creating your account. Please verify your email address to activate your account.</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 16px; background: #0f766e; color: #fff; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
        </p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${verificationUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const env = loadEnv();
  const mailer = getTransporter();

  await mailer.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject: "Reset your WaterWatch password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password reset request</h2>
        <p>Hello ${fullName},</p>
        <p>We received a request to reset your password. Click the button below to continue.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #0f766e; color: #fff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAdminInviteEmail({ to, inviteToken, registerUrl, loginUrl, expiresAt }) {
  const env = loadEnv();
  const mailer = getTransporter();

  const expiresText = expiresAt ? new Date(expiresAt).toLocaleString("en-NG") : "soon";
  const year = new Date().getFullYear();

  await mailer.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject: "Your WaterWatch admin invitation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Admin invitation created</h2>
        <p>Hello,</p>

        <p>
          You have been invited to register as a WaterWatch administrator.
          This invitation includes a one-time token that expires at <strong>${expiresText}</strong>.
        </p>

        <p>
          <a href="${registerUrl}" style="display: inline-block; padding: 10px 16px; background: #0f766e; color: #fff; text-decoration: none; border-radius: 6px;">
            Register as Admin
          </a>
        </p>

        <p>
          If the link does not work, copy and paste this URL into your browser:<br />
          <span style="word-break: break-all;">${registerUrl}</span>
        </p>

        <h3 style="margin-top: 18px;">Your one-time admin token</h3>
        <p>
          <strong style="display: inline-block; padding: 6px 10px; background: #f3f4f6; border-radius: 6px; letter-spacing: 0.2px;">
            ${inviteToken}
          </strong>
        </p>

        <h3 style="margin-top: 18px;">How to complete registration</h3>
        <ol style="padding-left: 18px;">
          <li>Open the admin registration page using the link above.</li>
          <li>
            Register using the <strong>same email address</strong> this invitation was sent to.
          </li>
          <li>Paste the token into the “Admin invite token” field.</li>
          <li>Set your password and submit the registration form.</li>
          <li>
            After registration, check your email for a verification message and click the verification link.
            (Please also check your spam/junk folder.)
          </li>
        </ol>

        <p style="margin-top: 14px;">
          After verification, sign in here:<br />
          <a href="${loginUrl}" style="display: inline-block; margin-top: 6px; padding: 10px 16px; background: #0891b2; color: #fff; text-decoration: none; border-radius: 6px;">
            Admin Sign In
          </a>
        </p>

        <p style="margin-top: 18px; color: #6b7280;">
          For security, do not share this token with anyone. If you did not request this invitation, you can ignore this email.
        </p>

        <p style="color: #6b7280;">WaterWatch Admin Team © ${year}</p>
      </div>
    `,
  });
}
