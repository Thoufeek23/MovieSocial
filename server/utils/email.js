const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

// Simple email sender. Expects SMTP configuration in env vars. If SMTP not configured,
// falls back to logging the message to the console (useful for local dev).
const sendEmail = async ({ to, subject, text, html }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // If SENDGRID_API_KEY is present, prefer SendGrid HTTP API (avoids SMTP network issues on some hosts)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      sgMail.setApiKey(sendgridKey);
      const msg = {
        to,
        from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`,
        subject,
        text,
        html,
      };
      await sgMail.send(msg);
      logger.info('[email] Sent via SendGrid', { to, subject });
      return;
    } catch (sgErr) {
      logger.error('[email] SendGrid send failed', sgErr && sgErr.message ? sgErr.message : sgErr);
      // fall through to SMTP fallback if configured
    }
  }

  if (!smtpHost || !smtpPort) {
    logger.warn('SMTP not configured; falling back to logged email output');
    logger.debug('email.payload', { to, subject, text: text ? '[text]' : undefined, html: html ? '[html]' : undefined });
    return;
  }

  // Build transporter with sensible timeouts so failures surface quickly in hosted environments
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: Number(smtpPort) === 465, // true for 465, false for other ports
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    // timeouts in ms - helps surface network/connectivity issues quickly
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    // Some SMTP endpoints may require relaxed TLS; don't change this in production unless needed
    tls: { rejectUnauthorized: false },
  });

  // Verify transporter configuration / connectivity so logs show clear failures early
  try {
    await transporter.verify();
  } catch (verifyErr) {
    logger.error('[email] SMTP verify failed', {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser ? smtpUser : '(none)',
      error: verifyErr && verifyErr.message ? verifyErr.message : verifyErr,
    });
    // rethrow so callers (controllers) can catch and optionally fall back/log
    throw verifyErr;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`,
      to,
      subject,
      text,
      html,
    });
    logger.info('[email] Sent via SMTP', { to, subject });
  } catch (sendErr) {
    logger.error('[email] sendMail failed', { to, subject, error: sendErr && sendErr.message ? sendErr.message : sendErr });
    throw sendErr;
  }
};

module.exports = { sendEmail };
