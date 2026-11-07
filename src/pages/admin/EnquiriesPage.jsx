import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Trash2, UserPlus } from 'lucide-react';
import { useCrmStore } from '@/features/admin/store/useCrmStore';
import { Btn, Card } from '@/features/admin/components/ui';
import LeadFormModal from '@/features/admin/components/LeadFormModal';
import { CONFIGS, PROJECTS } from '@/features/admin/constants';
import { fmtDateTime } from '@/features/admin/utils';
import { cn } from '@/utils/cn';

/** Guess project/config from the free-text "interested in" value. */
const interestTo = (v = '') => ({
  project: PROJECTS.find((p) => v.includes(p)) || '',
  config: CONFIGS.find((c) => v.toLowerCase().includes(c.toLowerCase())) || (v.includes('Studio') ? 'Studio' : ''),
});

export default function EnquiriesPage() {
  const enquiries = useCrmStore((s) => s.enquiries);
  const mark = useCrmStore((s) => s.markEnquiry);
  const remove = useCrmStore((s) => s.deleteEnquiry);
  const navigate = useNavigate();
  const [converting, setConverting] = useState(null);
  const initial = useMemo(
    () =>
      converting && {
        name: converting.name,
        phone: converting.phone,
        email: converting.email || '',
        source: 'Website',
        notes: converting.message || '',
        ...interestTo(converting.interest),
      },
    [converting],
  );


  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold">Website enquiries</h1>
      <p className="mt-1 text-sm text-slate-500">
        Messages from the website’s contact and site-visit forms. Convert one into a lead to start tracking it.
      </p>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Without a server, enquiries are only recorded in the browser where the form was filled. Every enquiry still
        reaches you on WhatsApp.
      </p>

      <div className="mt-6 space-y-3">
        {enquiries.map((e) => (
          <Card key={e.id} className={cn('p-4 sm:p-5', !e.read && 'border-primary-300 ring-1 ring-primary-200')}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {!e.read && <span className="rounded-full bg-primary-400 px-2 py-0.5 text-[11px] font-bold text-navy-950">NEW</span>}
                  <span className="text-xs font-semibold text-slate-500">{e.form}</span>
                  <span className="text-xs text-slate-400">{fmtDateTime(e.at)}</span>
                </div>
                <p className="mt-1.5 text-lg font-semibold">{e.name}</p>
                <p className="text-sm text-slate-600">
                  +91 {e.phone}
                  {e.email ? ` · ${e.email}` : ''}
                  {e.interest ? ` · ${e.interest}` : ''}
                </p>
                {e.message && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{e.message}</p>}
                {e.leadId && (
                  <button type="button" onClick={() => navigate(`/admin/leads/${e.leadId}`)} className="mt-2 text-sm font-semibold text-primary-700 hover:underline">
                    Converted to {e.leadId} →
                  </button>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {!e.leadId && (
                  <Btn onClick={() => setConverting(e)}>
                    <UserPlus className="h-4 w-4" /> Convert to lead
                  </Btn>
                )}
                {!e.read && (
                  <Btn variant="outline" onClick={() => mark(e.id, { read: true })}>Mark read</Btn>
                )}
                <button type="button" aria-label="Delete enquiry" onClick={() => window.confirm('Delete this enquiry?') && remove(e.id)} className="rounded-xl p-2.5 text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {enquiries.length === 0 && (
          <Card className="flex flex-col items-center p-12 text-center text-slate-500">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-navy-900">No website enquiries yet</p>
            <p className="mt-1 text-sm">When someone sends the contact or site-visit form on this browser, it appears here.</p>
          </Card>
        )}
      </div>

      <LeadFormModal
        open={!!converting}
        onClose={() => setConverting(null)}
        initial={initial}
        onSaved={(id) => {
          mark(converting.id, { read: true, leadId: id });
          navigate(`/admin/leads/${id}`);
        }}
      />
    </div>
  );
}
