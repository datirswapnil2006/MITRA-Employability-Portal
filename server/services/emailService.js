// Sends emails via Nodemailer. Defaults to Gmail SMTP using
// your own Gmail account — genuinely free, no third-party signup required.
// To use it: enable 2-Step Verification on your Google account, then create
// an "App Password" at https://myaccount.google.com/apppasswords and use
// that (not your normal Gmail password) as SMTP_PASS in .env.
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

export const sendWelcomeEmail = async ({ to, name, erpNumber, branch, year }) => {
  try {
    const t = getTransporter();
    const portalUrl = process.env.CLIENT_URL || "http://localhost:5173";

    await t.sendMail({
      from: process.env.SMTP_FROM || `"MITRA Employability Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: "Welcome to MITRA Employability Portal! 🎉",
      text: `Hi ${name},\n\nWelcome to MITRA Employability Portal! Your student account has been successfully created and approved.\n\nERP Number: ${erpNumber}\nDepartment: ${branch || 'N/A'}\nAcademic Year: ${year || 'N/A'}\n\nYou can log in directly at ${portalUrl}/login to start your placement preparation journey.\n\nBest regards,\nMITRA Training & Placement Cell`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #1E293B; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">MITRA Employability Portal</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">AI-Based Employability & Placement Assessment Platform</p>
          </div>
          <div style="padding: 28px; color: #334155;">
            <h2 style="color: #0F172A; font-size: 20px; margin-top: 0;">Welcome, ${name}! 🎉</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Your student account has been successfully created and is fully active. You can now access official placement assessments, AI self-test generators, practice drills, and study materials.
            </p>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 0 0 8px 0;"><strong>ERP Number:</strong> <span style="font-family: monospace; color: #2563EB;">${erpNumber}</span></p>
              <p style="margin: 0 0 8px 0;"><strong>Department:</strong> ${branch || 'N/A'}</p>
              <p style="margin: 0;"><strong>Academic Year:</strong> ${year || 'N/A'}</p>
            </div>

            <p style="margin: 24px 0; text-align: center;">
              <a href="${portalUrl}/login" style="background: #2563EB; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                Log In to Student Portal &rarr;
              </a>
            </p>

            <p style="color: #94A3B8; font-size: 12px; margin-top: 28px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
              If you did not register for this account, please contact the Training & Placement Cell.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn("Welcome email notification skipped or SMTP not configured:", err.message);
  }
};
