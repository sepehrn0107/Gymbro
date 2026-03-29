import nodemailer from "nodemailer"

import type { OtpType } from "@/types/domain"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send a generic email.
 *
 * Logs a structured error and re-throws if the send fails.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error({
      level: "error",
      op: "send_email",
      subject,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/** Human-readable label used in the OTP email subject and heading. */
function otpLabel(type: OtpType): string {
  return type === "email_verification" ? "Email Verification" : "Password Reset"
}

/**
 * Send a branded OTP email with a 6-digit code.
 *
 * Uses a dark-theme HTML template consistent with the GymBro design system.
 */
export async function sendOtpEmail(to: string, code: string, type: OtpType): Promise<void> {
  const label = otpLabel(type)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label} — GymBro</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background-color:#111111;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2563EB;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#F8FAFC;letter-spacing:1px;">
                GymBro
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#F8FAFC;">
                ${label}
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
                Use the code below to complete your ${label.toLowerCase()}. It expires in
                <strong style="color:#F8FAFC;">10 minutes</strong>.
              </p>

              <!-- Code block -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td align="center"
                    style="background-color:#1C1C1C;border-radius:8px;padding:20px;
                           font-size:36px;font-weight:700;letter-spacing:10px;
                           color:#F97316;font-family:monospace;">
                    ${code}
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
                If you did not request this, you can safely ignore this email.
                Your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0A0A0A;padding:16px 32px;">
              <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
                &copy; ${new Date().getFullYear()} GymBro. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  await sendEmail(to, `${label} — GymBro`, html)
}
