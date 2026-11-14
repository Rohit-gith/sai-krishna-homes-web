import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Globe,
  MapPin,
  MessageCircle,
  X,
} from 'lucide-react';
import { useSchedulerStore } from '@/store/useSchedulerStore';
import { useUiStore } from '@/store/useUiStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { COMPANY } from '@/data/companyInfo';
import { PROJECT_PAGES } from '@/data/projectPages';
import logoImg from '@/assets/logo/logo.png';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ */
/* Settings: change visit hours / length here                          */
/* ------------------------------------------------------------------ */
const VISIT_MINUTES = 45;
const FIRST_SLOT = 10 * 60; // 10:00 AM
const LAST_SLOT = 17 * 60; // 5:00 PM (visit ends by 5:45 PM)
const SLOT_STEP = 30;
const MIN_NOTICE_MIN = 120; // a slot must start at least 2 hours from now
const DAYS_AHEAD = 45;
const CONFIGS = ['1 BHK', '2 BHK', '3 BHK', 'Not sure yet'];

// Short place name for the cards ("South Bhubaneswar · Near …" → "South Bhubaneswar").
const PROJECTS = PROJECT_PAGES.map((p) => ({ slug: p.slug, name: p.name, place: p.location.split('·')[0].trim() }));
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const fmtTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const at = (day, mins) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(mins / 60), mins % 60);
const stamp = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(
    d.getMinutes(),
  ).padStart(2, '0')}00`;

function slotsFor(day) {
  const now = new Date();
  const out = [];
  for (let m = FIRST_SLOT; m <= LAST_SLOT; m += SLOT_STEP) {
    const t = at(day, m);
    out.push({ mins: m, ok: (t - now) / 60000 >= MIN_NOTICE_MIN });
  }
  return out;
}

/* ------------------------------------------------------------------ */

function Calendar({ value, onChange }) {
  const today = startOfDay(new Date());
  const last = new Date(today);
  last.setDate(last.getDate() + DAYS_AHEAD);
  const [month, setMonth] = useState(() => new Date((value || today).getFullYear(), (value || today).getMonth(), 1));

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= last;
  const shift = (d) => setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-serif text-[1.25rem] text-navy-950">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-1">
          {[
            [-1, canPrev, ChevronLeft, 'Previous month'],
            [1, canNext, ChevronRight, 'Next month'],
          ].map(([d, ok, Icon, label]) => (
            <button
              key={label}
              type="button"
              disabled={!ok}
              onClick={() => shift(d)}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-primary-100 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEK.map((w) => (
          <span key={w} className="pb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const disabled = d < today || d > last || !slotsFor(d).some((s) => s.ok);
          const picked = Boolean(sameDay(d, value));
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onChange(d)}
              aria-pressed={picked}
              aria-label={fmtDate(d)}
              className={cn(
                'relative mx-auto flex aspect-square w-full max-w-[2.75rem] items-center justify-center rounded-full text-[14.5px] font-semibold transition-colors',
                picked
                  ? 'bg-navy-900 text-white'
                  : disabled
                    ? 'cursor-default text-slate-300'
                    : 'bg-primary-100 font-bold text-navy-950 hover:bg-primary-200',
              )}
            >
              {d.getDate()}
              {sameDay(d, today) && !picked && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function SchedulerModal() {
  const { open, prefill, openScheduler, closeScheduler } = useSchedulerStore();
  const closeMenu = useUiStore((s) => s.closeMobileMenu);
  const [step, setStep] = useState(1);
  const [project, setProject] = useState(PROJECTS[0].slug);
  const [day, setDay] = useState(null);
  const [time, setTime] = useState(null);
  const [f, setF] = useState({ name: '', phone: '', email: '', config: '2 BHK', notes: '' });
  const [err, setErr] = useState('');

  // Any link to "#book-visit" opens the scheduler (navbar, footer, mobile bar, CTAs).
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href$="#book-visit"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      closeMenu();
      openScheduler({ project: a.dataset.project });
    };
    document.addEventListener('click', onClick, true);
    if (window.location.hash === '#book-visit') openScheduler({});
    return () => document.removeEventListener('click', onClick, true);
  }, [openScheduler, closeMenu]);

  // Fresh start every time it opens, keeping anything passed in.
  useEffect(() => {
    if (!open) return undefined;
    setStep(1);
    setDay(null);
    setTime(null);
    setErr('');
    if (prefill.project && PROJECTS.some((p) => p.slug === prefill.project)) setProject(prefill.project);
    setF((v) => ({ ...v, name: prefill.name || v.name, phone: prefill.phone || v.phone, config: prefill.config || v.config }));
    const onKey = (e) => e.key === 'Escape' && closeScheduler();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, prefill, closeScheduler]);

  const proj = PROJECTS.find((p) => p.slug === project);
  const start = day && time != null ? at(day, time) : null;
  const end = start ? new Date(start.getTime() + VISIT_MINUTES * 60000) : null;
  const when = start ? `${fmtDate(start)}, ${fmtTime(time)} – ${fmtTime(time + VISIT_MINUTES)}` : '';

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }));

  const confirm = (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Please enter your full name.');
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setErr('Please enter a valid 10-digit mobile number.');
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.');
    setErr('');
    useCrmStore.getState().captureEnquiry({
      form: `Site visit booking · ${proj.name}`,
      name: f.name.trim(),
      phone: f.phone,
      email: f.email.trim(),
      interest: `${proj.name} · ${f.config}`,
      message: `Requested visit: ${when}${f.notes.trim() ? `. Note: ${f.notes.trim()}` : ''}`,
      visitAt: start.toISOString(),
    });
    const msg = [
      `Hello ${COMPANY.shortName}, I'd like to book a site visit.`,
      '',
      `Project: ${proj.name}`,
      `Date: ${fmtDate(start)}`,
      `Time: ${fmtTime(time)} (${VISIT_MINUTES} min)`,
      `Name: ${f.name.trim()}`,
      `Mobile: ${f.phone}`,
      f.email.trim() ? `Email: ${f.email.trim()}` : null,
      `Looking for: ${f.config}`,
      f.notes.trim() ? `Note: ${f.notes.trim()}` : null,
    ]
      .filter((x) => x !== null)
      .join('\n');
    window.open(`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    setStep(3);
    return undefined;
  };

  const gcal = start
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Site visit: ${proj.name}`)}&dates=${stamp(start)}/${stamp(
        end,
      )}&ctz=Asia/Kolkata&details=${encodeURIComponent(`Site visit with ${COMPANY.name}. Contact: ${COMPANY.phoneDisplay}`)}&location=${encodeURIComponent(`${proj.name}, ${proj.place}`)}`
    : '#';

  const downloadIcs = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sai Krishna Homes//Site visit//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@saikrishnahomes`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART;TZID=Asia/Kolkata:${stamp(start)}`,
      `DTEND;TZID=Asia/Kolkata:${stamp(end)}`,
      `SUMMARY:Site visit: ${proj.name}`,
      `LOCATION:${proj.name}, ${proj.place}`,
      `DESCRIPTION:Site visit with ${COMPANY.name}. Contact: ${COMPANY.phoneDisplay}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'site-visit.ics' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const field =
    'mt-1.5 w-full border border-navy-900/15 bg-white px-3.5 py-3 text-[15px] text-navy-950 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';
  const label = 'text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-500';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-navy-950/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeScheduler}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sched-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[94vh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-t-2xl bg-ivory shadow-2xl sm:rounded-2xl md:grid-cols-[19rem_1fr] md:overflow-hidden"
          >
            <button
              type="button"
              onClick={closeScheduler}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy-950 shadow hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* left: event summary (like Calendly's event panel) */}
            <aside className="bg-navy-950 px-5 pb-5 pt-5 text-white sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-1.5 sm:h-11 sm:w-11">
                  <img src={logoImg} alt="" className="h-auto w-full" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-300">{COMPANY.shortName}</span>
              </div>
              <h2 id="sched-title" className="mt-3 font-serif text-[1.5rem] leading-tight text-white sm:mt-5 sm:text-[1.8rem]">
                Book a site visit
              </h2>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-white/80 sm:mt-5 sm:block sm:space-y-3 sm:text-[14px]">
                <li className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary-300" /> {VISIT_MINUTES} min guided tour
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                  <span>
                    {proj.name}
                    <span className="hidden text-[12.5px] text-white/55 sm:block">{proj.place}</span>
                  </span>
                </li>
                <li className="hidden items-center gap-2.5 sm:flex">
                  <Globe className="h-4 w-4 text-primary-300" /> India Standard Time
                </li>
                {start && (
                  <li className="flex w-full items-start gap-2.5 text-primary-200">
                    <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" /> <span>{when}</span>
                  </li>
                )}
              </ul>
              <p className="mt-6 hidden border-t border-white/10 pt-5 text-[12.5px] leading-relaxed text-white/55 md:block">
                Free and no obligation. Our team meets you at the site, walks you through the homes and amenities, and
                answers every question on price and loans.
              </p>
            </aside>

            {/* right: the steps */}
            <div className="p-5 sm:p-8 md:overflow-y-auto">
              {step === 1 && (
                <div>
                  <p className={label}>Step 1 of 2 · Choose a project, date and time</p>
                  <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Project">
                    {PROJECTS.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        role="radio"
                        aria-checked={project === p.slug}
                        onClick={() => setProject(p.slug)}
                        className={cn(
                          'border px-3 py-3 text-left transition-colors',
                          project === p.slug ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:border-primary-400',
                        )}
                      >
                        <span className="block font-serif text-[1.02rem] leading-tight">{p.name}</span>
                        <span className={cn('mt-0.5 block truncate text-[11.5px]', project === p.slug ? 'text-white/60' : 'text-slate-500')}>{p.place}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_12rem]">
                    <Calendar
                      value={day}
                      onChange={(d) => {
                        setDay(d);
                        setTime(null);
                        // phones: bring the time slots into view
                        if (window.innerWidth < 1024) {
                          setTimeout(() => document.getElementById('sched-times')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                        }
                      }}
                    />
                    <div id="sched-times" className="scroll-mt-4">
                      <p className="font-serif text-[1.05rem] text-navy-950">
                        {day ? day.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Pick a date'}
                      </p>
                      {day ? (
                        <div id="sched-slots" className="mt-3 grid grid-cols-2 gap-2 lg:max-h-[22rem] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
                          {slotsFor(day).filter((s) => s.ok).map((s) =>
                            time === s.mins ? (
                              <div key={s.mins} className="col-span-2 grid grid-cols-2 gap-1.5 lg:col-span-1">
                                <span className="flex items-center justify-center bg-navy-700 py-3 text-[13.5px] font-semibold text-white">{fmtTime(s.mins)}</span>
                                <button
                                  type="button"
                                  onClick={() => setStep(2)}
                                  className="bg-primary-500 py-3 text-[13px] font-bold text-navy-950 hover:bg-primary-400"
                                >
                                  Next
                                </button>
                              </div>
                            ) : (
                              <button
                                key={s.mins}
                                type="button"
                                disabled={!s.ok}
                                onClick={() => setTime(s.mins)}
                                className="border border-primary-400/60 bg-white py-3 text-[13.5px] font-semibold text-navy-900 transition-colors hover:border-navy-900 disabled:border-navy-900/10 disabled:text-slate-300 disabled:line-through"
                              >
                                {fmtTime(s.mins)}
                              </button>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">Available times show here once you pick a date.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={confirm} noValidate>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-700 hover:text-navy-900">
                    <ArrowLeft className="h-4 w-4" /> Change date or time
                  </button>
                  <p className={cn(label, 'mt-5')}>Step 2 of 2 · Your details</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={label}>Full name *</span>
                      <input value={f.name} onChange={set('name')} autoComplete="name" className={field} placeholder="Your name" />
                    </label>
                    <label className="block">
                      <span className={label}>Mobile number *</span>
                      <input value={f.phone} onChange={set('phone')} inputMode="numeric" autoComplete="tel-national" className={field} placeholder="10-digit number" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className={label}>Email (optional)</span>
                      <input value={f.email} onChange={set('email')} type="email" autoComplete="email" className={field} placeholder="you@example.com" />
                    </label>
                  </div>
                  <p className={cn(label, 'mt-5')}>Looking for</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CONFIGS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setF((v) => ({ ...v, config: c }))}
                        aria-pressed={f.config === c}
                        className={cn(
                          'border px-4 py-2 text-[13px] font-semibold transition-colors',
                          f.config === c ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:border-primary-400',
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <label className="mt-5 block">
                    <span className={label}>Anything we should know? (optional)</span>
                    <textarea value={f.notes} onChange={set('notes')} rows={3} className={field} placeholder="e.g. coming with family, need a home-loan discussion" />
                  </label>
                  {err && (
                    <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                      {err}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="mt-6 flex w-full items-center justify-center gap-2.5 bg-navy-900 px-6 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white hover:bg-navy-800"
                  >
                    <MessageCircle className="h-5 w-5 text-primary-300" /> Confirm visit on WhatsApp
                  </button>
                  <p className="mt-3 text-center text-[12px] text-slate-500">
                    WhatsApp opens with your booking filled in. Just press send.
                  </p>
                </form>
              )}

              {step === 3 && (
                <div className="py-4 text-center sm:py-8">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" strokeWidth={1.5} />
                  <h3 className="mt-4 font-serif text-[1.9rem] leading-tight text-navy-950">Visit requested</h3>
                  <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
                    {proj.name} · {when}. Send the WhatsApp message and our team will confirm your slot shortly.
                  </p>
                  <div className="mx-auto mt-7 grid max-w-md gap-3 sm:grid-cols-2">
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border border-navy-900/15 bg-white px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-navy-900 hover:border-primary-400"
                    >
                      <CalendarPlus className="h-4 w-4 text-primary-600" /> Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={downloadIcs}
                      className="flex items-center justify-center gap-2 border border-navy-900/15 bg-white px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-navy-900 hover:border-primary-400"
                    >
                      <Download className="h-4 w-4 text-primary-600" /> Calendar file
                    </button>
                  </div>
                  <p className="mt-6 text-[13px] text-slate-500">
                    WhatsApp didn&apos;t open? Call us on{' '}
                    <a href={`tel:${COMPANY.phone}`} className="font-semibold text-navy-900 underline-offset-4 hover:underline">
                      {COMPANY.phoneDisplay}
                    </a>
                  </p>
                  <button type="button" onClick={closeScheduler} className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-700 hover:text-navy-900">
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
