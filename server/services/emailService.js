// Sends password-reset emails via Nodemailer. Defaults to Gmail SMTP using
// your own Gmail account — genuinely free, no third-party signup required.
// To use it: enable 2-Step Verification on your Google account, then create
// an "App Password" at https://myaccount.google.com/apppasswords and use
// that (not your normal Gmail password) as SMTP_PASS below.
import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER / SMTP_PASS are not configured on the server");
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const t = getTransporter();

  await t.sendMail({
    from: process.env.SMTP_FROM || `"PRMITR Assess" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your PRMITR Assess password",
    text: `Hi ${name},\n\nWe received a request to reset your password. This link is valid for 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1E293B;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your PRMITR Assess password. This link is valid for <strong>1 hour</strong>.</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="background: #2563EB; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748B; font-size: 13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
  });
};
