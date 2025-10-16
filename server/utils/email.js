const nodemailer = require('nodemailer');

// Simple email sender. Expects SMTP configuration in env vars. If SMTP not configured,
// falls back to logging the message to the console (useful for local dev).
const sendEmail = async ({ to, subject, text, html }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort) {
    console.warn('SMTP not configured; falling back to console logging for email');
    console.log('--- Email ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    if (text) console.log('Text:', text);
    if (html) console.log('HTML:', html);
    console.log('--- End Email ---');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465, // true for 465, false for other ports
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
