import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { STATUS } from '../constants';
import { fmtDate } from '../utils';

/*
 * The two safety notices used by the lead forms (the server checks the same and keeps every
 * "add anyway" / "value is correct" on the lead and in the Activity log):
 *  - DuplicateNotice: this mobile number is already a lead (who has it)
 *  - ValueNotice:     the deal value looks wrong (why), with a "yes, it is correct" tick if allowed
 */

export function DuplicateNotice({ duplicates, anyway, onAnyway }) {
  if (!duplicates?.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4 shrink-0" /> This mobile number is already a lead
      </p>
      <ul className="mt-2 space-y-1">
        {duplicates.map((d, i) => (
          <li key={d.id || i}>
            {d.id ? (
              <Link to={`/admin/leads/${d.id}`} target="_blank" className="font-semibold underline">
                {d.id} · {d.name}
              </Link>
            ) : (
              <span className="font-semibold">A customer</span>
            )}{' '}
            · with <b>{d.owner}</b> · {STATUS[d.status]?.label || d.status} · added{' '}
            {fmtDate(d.createdAt)}
            {d.inBin && <span className="text-amber-700"> · in the recycle bin</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-amber-800">
        Talk to them first, so two people don’t call the same customer.
      </p>
      {onAnyway && (
        <label className="mt-2 flex items-start gap-2 font-medium">
          <input
            type="checkbox"
            checked={anyway}
            onChange={(e) => onAnyway(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-amber-700"
          />
          Add it anyway (it will be marked as a possible duplicate, and the owner can see that)
        </label>
      )}
    </div>
  );
}

export function ValueNotice({ problem, ok, onOk }) {
  if (!problem) return null;
  const { check, canConfirm } = problem;
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${canConfirm ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}
    >
      <p className="flex items-center gap-2 font-semibold">
        <ShieldAlert className="h-4 w-4 shrink-0" /> Please check the deal value
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        {(check?.reasons || []).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {canConfirm ? (
        <label className="mt-2 flex items-start gap-2 font-medium">
          <input
            type="checkbox"
            checked={ok}
            onChange={(e) => onOk(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-amber-700"
          />
          Yes, this value is correct (this is noted on the lead and in the Activity log)
        </label>
      ) : (
        <p className="mt-2 font-medium">
          This looks like a typing mistake. Correct the value, or ask the owner to confirm it.
        </p>
      )}
    </div>
  );
}
