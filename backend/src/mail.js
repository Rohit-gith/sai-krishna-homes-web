import nodemailer from 'nodemailer';

/*
 * New-lead email to the owner. Configured with SMTP_* env vars (e.g. a Gmail account with an
 * App Password). If they are missing, alerts are skipped and the lead is still saved.
 */
let transport = null;
const configured = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ALERT_TO;

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }
  return transport;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function sendLeadAlert(e) {
  if (!configured()) return { skipped: true };
  const rows = [
    ['Form', e.form],
    ['Name', e.name],
    ['Phone', `+91 ${e.phone}`],
    ['Email', e.email],
    ['Interest', e.interest],
    ['Visit requested', e.visitAt ? new Date(e.visitAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : ''],
    ['Message', e.message],
    ['Received', new Date(e.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })],
  ].filter(([, v]) => v);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#0d3b30;margin:0 0 12px">New website enquiry</h2>
      <table cellpadding="8" style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `<tr><td style="background:#f6f1e6;font-weight:bold;width:150px;border:1px solid #e8dcc0">${esc(k)}</td><td style="border:1px solid #e8dcc0">${esc(v)}</td></tr>`).join('')}
      </table>
      <p style="margin-top:16px"><a href="tel:+91${esc(e.phone)}">Call +91 ${esc(e.phone)}</a> · <a href="https://wa.me/91${esc(e.phone)}">WhatsApp</a></p>
      <p style="color:#888;font-size:12px">Also saved in the admin panel under Enquiries.</p>
    </div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  await getTransport().sendMail({
    from: `"Sai Krishna Homes Website" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: process.env.ALERT_TO,
    replyTo: e.email || undefined,
    subject: `New enquiry: ${e.name} · ${e.form}`,
    text,
    html,
  });
  return { sent: true };
}
