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
    throw new Error("SMTP_USER / SMTP_PASS are not configured in environment variables");
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  // Default to port 587 for cloud deployments (Render, AWS, DigitalOcean) as port 465 is often blocked
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  const rawPass = process.env.SMTP_PASS || "";
  const cleanedPass = rawPass.replace(/\s+/g, "");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // false for 587 (STARTTLS), true for 465 (Implicit SSL)
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: cleanedPass,
    },
    tls: {
      rejectUnauthorized: false, // Avoid SSL certificate handshake failures on cloud servers
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return transporter;
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  try {
    const t = getTransporter();

    const info = await t.sendMail({
      from: process.env.SMTP_FROM || `"MITRA Employability Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: "Reset Your MITRA Portal Password",
      text: `Hi ${name},\n\nWe received a request to reset your MITRA Employability Portal password. This link is valid for 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nMITRA Training & Placement Cell`,
      html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; width: 100%; background-color: #ffffff; border: 1px solid #E2E8F0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1E293B; padding: 24px 28px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">MITRA Employability Portal</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94A3B8;">AI-Based Employability &amp; Placement Assessment Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0F172A;">Reset Your Password</h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">Hi ${name},</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="background-color: #2563EB; padding: 12px 28px;">
                    <a href="${resetUrl}" style="color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Reset Password &#8594;</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 28px; border-top: 1px solid #F1F5F9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">&copy; ${new Date().getFullYear()} MITRA Employability Portal. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    console.log(`[Email Service] Password reset email sent to ${to} (MessageID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[Email Service Error] Failed to send password reset email to ${to}:`, err.message);
    throw err;
  }
};

export const sendWelcomeEmail = async ({ to, name, erpNumber, branch, year }) => {
  try {
    const t = getTransporter();
    const rawUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const portalUrl = rawUrl.split(",")[0].trim().replace(/\/+$/, "");

    const info = await t.sendMail({
      from: process.env.SMTP_FROM || `"MITRA Employability Portal" <${process.env.SMTP_USER}>`,
      to,
      subject: "Welcome to MITRA Employability Portal - Account Created Successfully",
      text: `Hi ${name},\n\nWelcome to MITRA Employability Portal!\n\nYour student account has been successfully created and approved.\n\nAccount Details:\n- ERP Number: ${erpNumber}\n- Department: ${branch || 'N/A'}\n- Academic Year: ${year || 'N/A'}\n- Status: Active\n\nYou can log in at: ${portalUrl}/login\n\nStart your placement preparation journey with AI-powered assessments, coding practice, aptitude preparation, and more.\n\nBest regards,\nMITRA Training & Placement Cell`,
      html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MITRA Employability Portal</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #E2E8F0;">

          <!-- Header -->
          <tr>
            <td style="background-color: #1E293B; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">MITRA Employability Portal</h1>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #94A3B8;">AI-Based Employability &amp; Placement Assessment Platform</p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0F172A;">Welcome, ${name}!</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">
                Your student account has been successfully created and is now active. You can log in to access placement assessments, AI-powered practice tests, coding challenges, and study materials.
              </p>
            </td>
          </tr>

          <!-- Account Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">Account Details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B; width: 130px; vertical-align: top;">ERP Number</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #0F172A; font-weight: 700; font-family: 'Courier New', monospace;">${erpNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B; vertical-align: top;">Department</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #0F172A; font-weight: 600;">${branch || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B; vertical-align: top;">Academic Year</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #0F172A; font-weight: 600;">${year || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B; vertical-align: top;">Account Status</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #16A34A; font-weight: 700;">Active</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 32px 28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #2563EB; padding: 14px 32px;">
                    <a href="${portalUrl}/login" style="color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Log In to Student Portal &#8594;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #F1F5F9; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                If you did not register for this account, please contact the Training &amp; Placement Cell.
              </p>
              <p style="margin: 0; font-size: 11px; color: #CBD5E1;">&copy; ${new Date().getFullYear()} MITRA Employability Portal. All Rights Reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    console.log(`[Email Service] Welcome email successfully sent to ${to} (MessageID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`[Email Service Failure] Failed to send welcome email to ${to}:`, err.message);
    throw err;
  }
};
