/** ₹ formatting: full Indian grouping, or compact lakh/crore. */
export const inr = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
export const inrShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inr(v);
};

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

export const isToday = (iso) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
export const isOverdue = (iso) => !!iso && new Date(iso) < new Date(new Date().toDateString());

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
