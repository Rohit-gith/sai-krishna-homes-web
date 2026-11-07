import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/utils/cn';

const OPTIONS = ['1 BHK Apartment', '2 BHK Apartment', '3 BHK Apartment', 'Commercial'];
const field =
  'w-full border-0 border-b border-navy-900/20 bg-transparent px-0 py-3 text-[15px] text-navy-950 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-0';

/** "Send Us An Enquiry" for one project: saved for the admin, delivered on WhatsApp to the project lead. */
export default function ProjectEnquiryForm({ project }) {
  const toast = useUiStore((s) => s.showToast);
  const [f, setF] = useState({ name: '', phone: '', email: '', interest: '', message: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Please enter your full name.');
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setErr('Please enter a valid 10-digit phone number.');
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address.');
    if (!f.interest) return setErr('Please select your preferred configuration.');
    setErr('');
    useCrmStore.getState().captureEnquiry({
      form: `Enquiry · ${project.name}`,
      name: f.name.trim(),
      phone: f.phone,
      email: f.email.trim(),
      interest: `${project.name} · ${f.interest}`,
      message: f.message.trim(),
    });
    const msg = [
      `Hi ${project.contact.name.split(' ')[0]} Ji, I am interested in ${project.name}.`,
      '',
      `Name: ${f.name.trim()}`,
      `Phone: +91 ${f.phone}`,
      f.email && `Email: ${f.email.trim()}`,
      `Property interest: ${f.interest}`,
      f.message && `Message: ${f.message.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');
    const url = `https://wa.me/${project.contact.phone}?text=${encodeURIComponent(msg)}`;
    if (!window.open(url, '_blank')) window.location.href = url;
    toast('Opening WhatsApp. Just tap Send to reach our team.');
    setF({ name: '', phone: '', email: '', interest: '', message: '' });
    return undefined;
  };

  return (
    <form onSubmit={submit} noValidate className="bg-ivory p-6 sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary-700">Send Us An Enquiry</p>
      <p className="mt-2 font-serif text-2xl text-navy-950">Interested in {project.name}?</p>
      <p className="mt-1 text-[14.5px] text-slate-600">Drop us a message and we&apos;ll reach out to you.</p>
      <div className="mt-4 space-y-1">
        <label className="block"><span className="sr-only">Full name</span><input className={field} placeholder="Full Name *" value={f.name} onChange={set('name')} autoComplete="name" /></label>
        <label className="flex items-center gap-2 border-b border-navy-900/20 focus-within:border-primary-500">
          <span className="text-[15px] text-slate-500">+91</span>
          <span className="sr-only">Phone number</span>
          <input className={cn(field, 'border-0')} placeholder="Phone Number *" value={f.phone} onChange={set('phone')} inputMode="numeric" autoComplete="tel-national" />
        </label>
        <label className="block"><span className="sr-only">Email</span><input className={field} placeholder="Email Address" value={f.email} onChange={set('email')} type="email" autoComplete="email" /></label>
        <label className="block">
          <span className="sr-only">Property interest</span>
          <select className={cn(field, 'cursor-pointer', !f.interest && 'text-slate-400')} value={f.interest} onChange={set('interest')}>
            <option value="">Select your preferred configuration *</option>
            {OPTIONS.map((o) => <option key={o} className="text-navy-950">{o}</option>)}
          </select>
        </label>
        <label className="block"><span className="sr-only">Message</span><textarea className={field} rows={2} placeholder="Message" value={f.message} onChange={set('message')} /></label>
      </div>
      {err && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{err}</p>}
      <button type="submit" className="group mt-6 flex w-full items-center justify-center gap-2 bg-navy-900 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white hover:bg-navy-800">
        Submit Enquiry <ArrowRight className="h-4 w-4 text-primary-300 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}
