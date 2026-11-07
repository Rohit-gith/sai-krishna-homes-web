import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { APPLICATION_STAGES } from '@/constants/formOptions';
import { getServiceBySlug } from '@/data/services';
import { formatDate } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

export default function StatusTimeline({ application }) {
  const currentIndex = APPLICATION_STAGES.findIndex((s) => s.key === application.stage);
  const isApproved = application.stage === 'approved';
  const maskedMobile = application.mobile.replace(/^(\d{2})\d{5}(\d{3})$/, '$1•••••$2');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Registration Number</p>
          <p className="font-display text-2xl font-bold text-navy-950">{application.registrationNo}</p>
        </div>
        <Badge tone={isApproved ? 'primary' : 'amber'}>{APPLICATION_STAGES[currentIndex]?.label}</Badge>
      </div>

      <dl className="grid gap-4 border-b border-slate-100 py-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Applicant</dt>
          <dd className="font-medium text-navy-950">{application.applicantName}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Service</dt>
          <dd className="font-medium text-navy-950">{getServiceBySlug(application.service)?.title || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Mobile</dt>
          <dd className="font-medium text-navy-950">{maskedMobile}</dd>
        </div>
      </dl>

      <ol className="relative mt-8 space-y-8">
        {APPLICATION_STAGES.map((stage, i) => {
          const done = i < currentIndex || (i === currentIndex && isApproved);
          const active = i === currentIndex && !isApproved;
          return (
            <li key={stage.key} className="relative flex gap-4">
              {i < APPLICATION_STAGES.length - 1 && (
                <span
                  className={cn('absolute left-5 top-10 h-[calc(100%-0.5rem)] w-0.5', i < currentIndex ? 'bg-primary-500' : 'bg-slate-200')}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                  done && 'border-primary-600 bg-primary-600 text-white',
                  active && 'border-accent-500 bg-amber-50 text-accent-600',
                  !done && !active && 'border-slate-200 bg-white text-slate-300',
                )}
              >
                {done ? <Check className="h-5 w-5" /> : active ? <Clock className="h-5 w-5 animate-pulse" /> : i + 1}
              </span>
              <div className="pt-1.5">
                <p className={cn('font-semibold', done || active ? 'text-navy-950' : 'text-slate-400')}>{stage.label}</p>
                <p className="text-sm text-slate-500">
                  {i === 0 && formatDate(application.submittedAt)}
                  {i === currentIndex && i !== 0 && `Updated ${formatDate(application.updatedAt)}`}
                  {active && i === 0 && ' · In progress'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </motion.div>
  );
}
