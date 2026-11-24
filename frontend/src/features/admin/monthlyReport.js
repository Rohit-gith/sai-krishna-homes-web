import { jsPDF } from 'jspdf';
import { api } from '@/services/crmApi';
import logoUrl from '@/assets/logo/logo-mark.png'; // just the mark: it sits on the dark green header
import fontRegular from '@/assets/fonts/pdf/Manrope_400Regular.ttf?url';
import fontBold from '@/assets/fonts/pdf/Manrope_700Bold.ttf?url';
import fontHeavy from '@/assets/fonts/pdf/Manrope_800ExtraBold.ttf?url';
import fontDisplay from '@/assets/fonts/pdf/PlayfairDisplay_700Bold.ttf?url';

/*
 * The owner's monthly PDF: a 2-page A4 summary of one month (leads, enquiries, visits, deals, sales
 * by project and source, team performance, site visits) with a comparison to the month before.
 * Made in the browser from the same numbers as the Reports page (so Fidelsya never appears), in the
 * website's own fonts. This file and its fonts load only when someone downloads a report.
 */

const C = {
  green: '#0E3B32',
  greenDeep: '#0B2F28',
  gold: '#CFA557',
  goldSoft: '#F6EEDC',
  ink: '#10231F',
  text: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  card: '#F8FAF9',
  up: '#047857',
  down: '#BE123C',
  bars: ['#0E3B32', '#2F6F62', '#CFA557', '#7FA99E', '#B98B3E', '#A7C4BC'],
};
const W = 210;
const H = 297;
const M = 16; // page margin (mm)

/* ---------- numbers & dates ---------- */

const IST = '+05:30';
const pad = (n) => String(n).padStart(2, '0');
/** "2026-11" → the month's first and last moment in India time (or now, for the current month). */
export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const from = new Date(`${y}-${pad(m)}-01T00:00:00.000${IST}`);
  const next = new Date(
    `${m === 12 ? y + 1 : y}-${pad(m === 12 ? 1 : m + 1)}-01T00:00:00.000${IST}`,
  );
  const end = new Date(next.getTime() - 1);
  const now = new Date();
  return { from, to: end > now ? now : end, partial: end > now };
}
const prevMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
};
const monthName = (ym, style = 'long') =>
  new Date(`${ym}-15T12:00:00${IST}`).toLocaleDateString('en-IN', {
    month: style,
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
const day = (d) =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const stamp = (d) =>
  d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

/** Last 12 months for the picker, newest first: [{ id: '2026-11', label: 'November 2026 (so far)' }] */
export function recentMonths(n = 12) {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(ist.getFullYear(), ist.getMonth() - i, 15);
    const id = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    out.push({ id, label: `${monthName(id)}${i === 0 ? ' (so far)' : ''}` });
  }
  return out;
}

const inrFull = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const inrShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
  return inrFull(v);
};
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
/** "+12% vs Oct" / "−8% vs Oct" / "new" / "same as Oct" */
function delta(now, before, short) {
  if (!before && !now) return { text: `same as ${short}`, color: C.muted };
  if (!before) return { text: `new this month (none in ${short})`, color: C.up };
  const d = Math.round(((now - before) / before) * 100);
  if (d === 0) return { text: `same as ${short}`, color: C.muted };
  return { text: `${d > 0 ? '+' : '−'}${Math.abs(d)}% vs ${short}`, color: d > 0 ? C.up : C.down };
}

/* ---------- loading fonts + logo ---------- */

const toBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
let assets = null;
const loadAssets = () =>
  (assets ??= Promise.all(
    [fontRegular, fontBold, fontHeavy, fontDisplay, logoUrl].map((u) =>
      fetch(u).then((r) => {
        if (!r.ok)
          throw new Error('Could not load the report files. Check the internet and retry.');
        return r.arrayBuffer();
      }),
    ),
  )
    .then(([reg, bold, heavy, display, logo]) => ({
      fonts: [
        ['Manrope-Regular.ttf', 'Manrope', 'normal', reg],
        ['Manrope-Bold.ttf', 'Manrope', 'bold', bold],
        ['Manrope-ExtraBold.ttf', 'Manrope', 'heavy', heavy],
        ['Playfair-Bold.ttf', 'Playfair', 'bold', display],
      ].map(([file, family, style, buf]) => [file, family, style, toBase64(buf)]),
      logo: `data:image/png;base64,${toBase64(logo)}`,
    }))
    .catch((e) => {
      assets = null;
      throw e;
    }));

/* ---------- drawing ---------- */

function makeDoc({ fonts }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  for (const [file, family, style, b64] of fonts) {
    doc.addFileToVFS(file, b64);
    doc.addFont(file, family, style);
  }
  return doc;
}
const font = (doc, style, size, color) => {
  doc.setFont(style === 'display' ? 'Playfair' : 'Manrope', style === 'display' ? 'bold' : style);
  doc.setFontSize(size);
  if (color) doc.setTextColor(color);
};

function sectionTitle(doc, y, title, sub) {
  font(doc, 'heavy', 8, C.gold);
  doc.setCharSpace(0.6);
  doc.text(title.toUpperCase(), M, y);
  doc.setCharSpace(0);
  if (sub) {
    font(doc, 'normal', 8, C.muted);
    doc.text(sub, W - M, y, { align: 'right' });
  }
  doc.setDrawColor(C.line);
  doc.setLineWidth(0.3);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  return y + 9;
}

/** A simple table. cols: [{ label, w, align, get(row) → text, style?(row) }]. Returns the new y. */
function table(doc, y, cols, rows, { zebra = true, highlight } = {}) {
  const rowH = 7.5;
  const x0 = M;
  font(doc, 'bold', 7.5, C.muted);
  let x = x0;
  for (const c of cols) {
    const tx = c.align === 'right' ? x + c.w - 2 : x + 2;
    doc.text(c.label, tx, y, { align: c.align === 'right' ? 'right' : 'left' });
    x += c.w;
  }
  y += 3;
  rows.forEach((r, i) => {
    if (highlight?.(r)) {
      doc.setFillColor(C.goldSoft);
      doc.rect(x0, y, W - 2 * M, rowH, 'F');
    } else if (zebra && i % 2 === 0) {
      doc.setFillColor(C.card);
      doc.rect(x0, y, W - 2 * M, rowH, 'F');
    }
    x = x0;
    for (const c of cols) {
      const st = c.style?.(r) || {};
      font(doc, st.bold ? 'bold' : 'normal', 9, st.color || C.ink);
      const t = String(c.get(r) ?? '—');
      const tx = c.align === 'right' ? x + c.w - 2 : x + 2;
      const fit = doc.splitTextToSize(t, c.w - 3)[0];
      doc.text(fit, tx, y + 5, { align: c.align === 'right' ? 'right' : 'left' });
      x += c.w;
    }
    y += rowH;
  });
  return y + 3;
}

function footer(doc, monthLabel) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(C.line);
    doc.setLineWidth(0.3);
    doc.line(M, H - 14, W - M, H - 14);
    font(doc, 'normal', 7.5, C.muted);
    doc.text(
      `Sai Krishna Homes Pvt. Ltd. · Monthly report · ${monthLabel} · Confidential`,
      M,
      H - 9,
    );
    doc.text(`Page ${i} of ${n}`, W - M, H - 9, { align: 'right' });
  }
}

/* ---------- the report ---------- */

export async function downloadMonthlyReport(ym, preparedBy = '') {
  const cur = monthRange(ym);
  const pm = prevMonth(ym);
  const prev = monthRange(pm);
  const q = (r) =>
    `/reports?from=${encodeURIComponent(r.from.toISOString())}&to=${encodeURIComponent(r.to.toISOString())}`;
  const [data, before, files] = await Promise.all([api(q(cur)), api(q(prev)), loadAssets()]);
  const doc = makeDoc(files);
  const t = data.totals;
  const b = before.totals;
  const pShort = monthName(pm, 'short').split(' ')[0];
  const label = monthName(ym);
  const conv = pct(t.won, t.won + t.lost);
  const convB = pct(b.won, b.won + b.lost);

  /* header band */
  doc.setFillColor(C.green);
  doc.rect(0, 0, W, 64, 'F');
  doc.setFillColor(C.greenDeep);
  doc.rect(0, 52, W, 12, 'F');
  doc.setFillColor(C.gold);
  doc.rect(0, 64, W, 1.2, 'F');
  doc.addImage(files.logo, 'PNG', M, 13, 23, 23);
  font(doc, 'heavy', 8.5, C.gold);
  doc.setCharSpace(1.2);
  doc.text('SAI KRISHNA HOMES', M + 27, 19);
  doc.setCharSpace(0);
  font(doc, 'display', 25, '#FFFFFF');
  doc.text('Monthly Business Report', M + 27, 31);
  font(doc, 'normal', 11, '#D7E3DF');
  doc.text(
    `${label}${cur.partial ? `  ·  1 – ${day(cur.to)} (month in progress)` : `  ·  1 – ${day(cur.to)}`}`,
    M + 27,
    39,
  );
  font(doc, 'normal', 8, '#BFD2CC');
  doc.text(`Prepared ${stamp(new Date())}${preparedBy ? ` for ${preparedBy}` : ''}`, M, 59.5);
  doc.text(`Compared with ${monthName(pm)}`, W - M, 59.5, { align: 'right' });

  /* KPI cards: 3 × 2 */
  const kpis = [
    ['New leads', String(t.newLeads), delta(t.newLeads, b.newLeads, pShort)],
    [
      'Website enquiries',
      String(t.enquiries ?? 0),
      delta(t.enquiries ?? 0, b.enquiries ?? 0, pShort),
    ],
    ['Site visits', String(t.visits), delta(t.visits, b.visits, pShort)],
    ['Deals won', String(t.won), delta(t.won, b.won, pShort)],
    ['Sales value', inrShort(t.wonValue), delta(t.wonValue, b.wonValue, pShort)],
    [
      'Conversion',
      conv === null ? '—' : `${conv}%`,
      conv === null || convB === null
        ? { text: 'won ÷ (won + lost)', color: C.muted }
        : {
            text: `${conv - convB >= 0 ? '+' : '−'}${Math.abs(conv - convB)} pts vs ${pShort}`,
            color: conv >= convB ? C.up : C.down,
          },
    ],
  ];
  const cw = (W - 2 * M - 8) / 3;
  kpis.forEach(([name, value, d], i) => {
    const x = M + (i % 3) * (cw + 4);
    const y = 74 + Math.floor(i / 3) * 33;
    doc.setFillColor(C.card);
    doc.setDrawColor(C.line);
    doc.roundedRect(x, y, cw, 29, 2.5, 2.5, 'FD');
    doc.setFillColor(i === 4 ? C.gold : C.green);
    doc.rect(x, y + 4, 1.2, 21, 'F');
    font(doc, 'bold', 8, C.muted);
    doc.text(name, x + 5, y + 8);
    font(doc, 'heavy', 17, C.ink);
    doc.text(value, x + 5, y + 18.5);
    font(doc, 'bold', 7.5, d.color);
    doc.text(doc.splitTextToSize(d.text, cw - 8)[0], x + 5, y + 24.5);
  });

  /* sales by project */
  let y = sectionTitle(doc, 148, 'Sales by project', `${inrFull(t.wonValue)} in ${t.won} deal(s)`);
  const projects = data.projects.filter((p) => p.newLeads || p.won || p.lost).slice(0, 8);
  if (!projects.length) {
    font(doc, 'normal', 9, C.muted);
    doc.text('No leads or deals this month.', M, y + 2);
    y += 10;
  } else {
    const maxV = Math.max(...projects.map((p) => p.wonValue), 1);
    for (const [i, p] of projects.entries()) {
      font(doc, 'bold', 9, C.ink);
      doc.text(doc.splitTextToSize(p.name, 55)[0], M, y + 4);
      font(doc, 'normal', 8, C.muted);
      doc.text(`${p.newLeads} new · ${p.won} won`, M, y + 8.2);
      const bx = M + 60;
      const bw = W - 2 * M - 60 - 34;
      doc.setFillColor('#EEF2F1');
      doc.roundedRect(bx, y + 1.5, bw, 5.5, 1.2, 1.2, 'F');
      if (p.wonValue > 0) {
        doc.setFillColor(C.bars[i % C.bars.length]);
        doc.roundedRect(bx, y + 1.5, Math.max(2.5, (bw * p.wonValue) / maxV), 5.5, 1.2, 1.2, 'F');
      }
      font(doc, 'bold', 9, C.ink);
      doc.text(inrShort(p.wonValue), W - M, y + 5.6, { align: 'right' });
      y += 11;
    }
  }

  /* where leads came from */
  y = sectionTitle(doc, y + 8, 'Where the leads came from', `${t.newLeads} new lead(s)`);
  const sources = [...data.sources]
    .filter((s) => s.newLeads || s.won)
    .sort((a, z) => z.newLeads - a.newLeads)
    .slice(0, 8);
  if (!sources.length) {
    font(doc, 'normal', 9, C.muted);
    doc.text('No new leads this month.', M, y + 2);
  } else {
    const maxL = Math.max(...sources.map((s) => s.newLeads), 1);
    const colW = (W - 2 * M - 8) / 2;
    sources.forEach((s, i) => {
      const x = M + (i % 2) * (colW + 8);
      const yy = y + Math.floor(i / 2) * 10;
      if (yy > H - 26) return;
      font(doc, 'bold', 8.5, C.ink);
      doc.text(doc.splitTextToSize(s.name, 30)[0], x, yy + 4.6);
      doc.setFillColor('#EEF2F1');
      doc.roundedRect(x + 32, yy + 1.4, colW - 32 - 24, 4.6, 1, 1, 'F');
      doc.setFillColor(C.bars[(i + 1) % C.bars.length]);
      doc.roundedRect(
        x + 32,
        yy + 1.4,
        Math.max(2, ((colW - 56) * s.newLeads) / maxL),
        4.6,
        1,
        1,
        'F',
      );
      font(doc, 'normal', 8, C.text);
      doc.text(`${s.newLeads} · ${s.won} won`, x + colW, yy + 4.8, { align: 'right' });
    });
  }

  /* ---------- page 2 ---------- */
  doc.addPage();
  doc.setFillColor(C.green);
  doc.rect(0, 0, W, 16, 'F');
  font(doc, 'display', 12, '#FFFFFF');
  doc.text('Monthly Business Report', M, 10.5);
  font(doc, 'normal', 9, '#D7E3DF');
  doc.text(label, W - M, 10.5, { align: 'right' });

  y = sectionTitle(doc, 28, 'Team performance', 'leads count for the person they are assigned to');
  const team = data.sales.filter((s) => s.newLeads || s.won || s.lost || s.attempts);
  const top = team.slice().sort((a, z) => z.wonValue - a.wonValue || z.won - a.won)[0];
  const topOk = top && top.won > 0;
  if (!team.length) {
    font(doc, 'normal', 9, C.muted);
    doc.text('No sales activity this month.', M, y + 2);
    y += 10;
  } else {
    y = table(
      doc,
      y,
      [
        {
          label: 'Team member',
          w: 52,
          get: (r) => `${r.name}${topOk && r.email === top.email ? '  · TOP' : ''}`,
          style: (r) => (topOk && r.email === top.email ? { bold: true, color: '#8A6A1F' } : {}),
        },
        { label: 'New leads', w: 20, align: 'right', get: (r) => r.newLeads },
        { label: 'Calls', w: 18, align: 'right', get: (r) => r.attempts },
        {
          label: 'Won',
          w: 16,
          align: 'right',
          get: (r) => r.won,
          style: (r) => (r.won ? { bold: true, color: C.up } : {}),
        },
        { label: 'Lost', w: 16, align: 'right', get: (r) => r.lost },
        {
          label: 'Sales value',
          w: 30,
          align: 'right',
          get: (r) => inrShort(r.wonValue),
          style: () => ({ bold: true }),
        },
        {
          label: 'Conversion',
          w: 26,
          align: 'right',
          get: (r) => (r.conversion === null ? '—' : `${r.conversion}%`),
        },
      ],
      team.slice(0, 14),
      { highlight: (r) => topOk && r.email === top.email },
    );
  }

  y = sectionTitle(
    doc,
    y + 4,
    'Site visits',
    t.avgRating ? `average rating ${t.avgRating} / 5` : '',
  );
  const guides = data.visits.filter((v) => v.visits);
  if (!guides.length) {
    font(doc, 'normal', 9, C.muted);
    doc.text('No site visits recorded this month.', M, y + 2);
    y += 10;
  } else {
    y = table(
      doc,
      y,
      [
        { label: 'Shown by', w: 56, get: (r) => r.name },
        { label: 'Visits', w: 20, align: 'right', get: (r) => r.visits },
        { label: 'People', w: 20, align: 'right', get: (r) => r.people },
        {
          label: 'Avg rating',
          w: 26,
          align: 'right',
          get: (r) => (r.avgRating ? `${r.avgRating} / 5` : '—'),
        },
        {
          label: 'Happy',
          w: 28,
          align: 'right',
          get: (r) => r.satisfied,
          style: (r) => (r.satisfied ? { color: C.up, bold: true } : {}),
        },
        {
          label: 'Not happy',
          w: 28,
          align: 'right',
          get: (r) => r.notSatisfied,
          style: (r) => (r.notSatisfied ? { color: C.down, bold: true } : {}),
        },
      ],
      guides.slice(0, 10),
    );
  }

  /* leads that came in this month: where they stand now */
  y = sectionTitle(doc, y + 4, 'Where this month’s leads stand today', `${t.newLeads} lead(s)`);
  const st = t.status || { open: 0, won: 0, lost: 0 };
  const all = st.open + st.won + st.lost;
  const parts = [
    ['Still being worked on', st.open, C.green],
    ['Won', st.won, C.gold],
    ['Lost', st.lost, '#CBD5E1'],
  ];
  let bx = M;
  const bw = W - 2 * M;
  if (all) {
    for (const [, n, color] of parts) {
      if (!n) continue;
      const w = (bw * n) / all;
      doc.setFillColor(color);
      doc.rect(bx, y, w, 7, 'F');
      bx += w;
    }
  } else {
    doc.setFillColor('#EEF2F1');
    doc.rect(M, y, bw, 7, 'F');
  }
  let lx = M;
  for (const [name, n, color] of parts) {
    doc.setFillColor(color);
    doc.rect(lx, y + 11, 3, 3, 'F');
    font(doc, 'normal', 8.5, C.text);
    const txt = `${name}: ${n}${all ? ` (${pct(n, all)}%)` : ''}`;
    doc.text(txt, lx + 4.5, y + 13.6);
    lx += doc.getTextWidth(txt) + 12;
  }
  y += 22;

  /* highlights */
  const best = data.projects.find((p) => p.wonValue > 0);
  const src = [...data.sources].sort((a, z) => z.newLeads - a.newLeads)[0];
  const happy = pct(t.satisfied, t.visits);
  const notes = [
    best &&
      `Best-selling project: ${best.name}, ${inrShort(best.wonValue)} from ${best.won} deal(s).`,
    topOk && `Top performer: ${top.name}, ${top.won} deal(s) worth ${inrShort(top.wonValue)}.`,
    src?.newLeads && `Most leads came from ${src.name} (${src.newLeads} of ${t.newLeads}).`,
    happy !== null && `${happy}% of visitors were happy after the site visit (rated 4 or 5).`,
    t.unassignedNew > 0 && `${t.unassignedNew} new lead(s) are not assigned to anyone yet.`,
  ].filter(Boolean);
  if (notes.length && y < H - 40) {
    const boxH = 10 + notes.length * 6.2;
    doc.setFillColor(C.goldSoft);
    doc.roundedRect(M, y, W - 2 * M, boxH, 2.5, 2.5, 'F');
    font(doc, 'heavy', 8, '#8A6A1F');
    doc.setCharSpace(0.6);
    doc.text('HIGHLIGHTS', M + 5, y + 7);
    doc.setCharSpace(0);
    notes.forEach((n, i) => {
      font(doc, 'normal', 9, C.ink);
      doc.text(`•  ${doc.splitTextToSize(n, W - 2 * M - 14)[0]}`, M + 5, y + 13.5 + i * 6.2);
    });
  }

  footer(doc, label);
  const file = `SKH-Monthly-Report-${ym}.pdf`;
  doc.save(file);
  api('/reports/downloaded', { method: 'POST', body: { month: ym } }).catch(() => {});
  return file;
}
