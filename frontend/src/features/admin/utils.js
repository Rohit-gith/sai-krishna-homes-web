/** ₹ formatting: full Indian grouping, or compact lakh/crore. */
export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
/** "₹65 lakh" / "₹6.5 crore": the size of a number in words, so a missing or extra zero is easy to spot. */
export const lakhCrore = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${+(v / 1e7).toFixed(2)} crore`;
  if (v >= 1e5) return `₹${+(v / 1e5).toFixed(2)} lakh`;
  if (v >= 1e3) return `₹${+(v / 1e3).toFixed(1)} thousand`;
  return inr(v);
};
export const inrShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
};

// Dates and times always show in India time, wherever the person opening the CRM is
// (a partner travelling abroad sees the same "20 Nov, 04:18 pm" as the office).
const IST = 'Asia/Kolkata';
const dayIST = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: IST }); // "2026-11-20"

export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: IST,
      })
    : '—';
export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: IST,
      })
    : '—';

/** Start of an India day ("2026-11-20") / end of it, as ISO. */
export const istDayStart = (ymd) => new Date(`${ymd}T00:00:00+05:30`).toISOString();
export const istDayEnd = (ymd) => new Date(`${ymd}T23:59:59.999+05:30`).toISOString();
/** Midnight in India, `days` days back counting today as day 1 (1 = today, 7 = last 7 days). */
export const istSince = (days) => {
  const start = new Date(istDayStart(dayIST(Date.now())));
  start.setUTCDate(start.getUTCDate() - (Number(days) - 1));
  return start.toISOString();
};

export const isToday = (iso) => !!iso && dayIST(iso) === dayIST(Date.now());
export const isOverdue = (iso) => !!iso && dayIST(iso) < dayIST(Date.now());

/** "SKH-0001" style lead IDs. */
export const leadId = (n) => `SKH-${String(n).padStart(4, '0')}`;

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Build a CSV string and trigger a download. */
export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
