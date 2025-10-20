const express = require('express');
const router = express.Router();
const net = require('net');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// GET /api/debug/smtp
// Attempts a raw TCP connection to SMTP_HOST:SMTP_PORT and then nodemailer.verify()
router.get('/smtp', async (req, res) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  if (!host || !port) return res.status(400).json({ ok: false, msg: 'SMTP_HOST or SMTP_PORT not set' });

  const timeoutMs = 7000;
  const result = { host, port };

  // Raw TCP connectivity test
  result.tcp = await new Promise((resolve) => {
    const socket = new net.Socket();
    let handled = false;
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      handled = true;
      socket.destroy();
      resolve({ ok: true, msg: 'TCP connect succeeded' });
    });
    socket.once('timeout', () => {
      if (handled) return;
      handled = true;
      socket.destroy();
      resolve({ ok: false, msg: 'TCP connect timeout' });
    });
    socket.once('error', (err) => {
      if (handled) return;
      handled = true;
      socket.destroy();
      resolve({ ok: false, msg: 'TCP error', error: err && err.message ? err.message : err });
    });
    try {
      socket.connect(port, host);
    } catch (e) {
      if (!handled) resolve({ ok: false, msg: 'TCP connect threw', error: e && e.message ? e.message : e });
    }
  });

  // If TCP failed, return early
  if (!result.tcp.ok) {
    logger.error('[debug/smtp] TCP test failed', result.tcp);
    return res.status(502).json({ ok: false, tcp: result.tcp, msg: 'TCP connectivity failed' });
  }

  // Build a nodemailer transporter and verify (short timeouts)
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 7000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    logger.info('[debug/smtp] nodemailer.verify succeeded');
    result.verify = { ok: true, msg: 'verify succeeded' };
    return res.json({ ok: true, tcp: result.tcp, verify: result.verify });
  } catch (e) {
    logger.error('[debug/smtp] nodemailer.verify failed', e && e.message ? e.message : e);
    result.verify = { ok: false, msg: 'verify failed', error: e && e.message ? e.message : e };
    return res.status(502).json({ ok: false, tcp: result.tcp, verify: result.verify });
  }
});

module.exports = router;
