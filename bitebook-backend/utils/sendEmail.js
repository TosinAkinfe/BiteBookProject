const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(toEmail, token, baseUrl) {
  const link = `${baseUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"BiteBook" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Verify your BiteBook email",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your account:</p>
        <a href="${link}"
           style="display:inline-block;padding:10px 20px;background:#FF7B00;color:#fff;text-decoration:none;border-radius:6px;">
          Verify Email
        </a>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(toEmail, token, baseUrl) {
  const link = `${baseUrl}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"BiteBook" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Reset your BiteBook password",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password:</p>
        <a href="${link}"
           style="display:inline-block;padding:10px 20px;background:#FF7B00;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#555;">This link expires in 1 hour.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
