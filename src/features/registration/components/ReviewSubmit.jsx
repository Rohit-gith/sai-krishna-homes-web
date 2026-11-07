import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, FileCheck2 } from 'lucide-react';
import StepActions from './StepActions';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { submitRegistration } from '@/services/registrationApi';
import { useUiStore } from '@/store/useUiStore';
import { getServiceBySlug } from '@/data/services';
import { ORGANIZATION_TYPES, ID_PROOF_TYPES } from '@/constants/formOptions';
import { ROUTES } from '@/constants/routes';

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || '—';

function ReviewBlock({ title, step, rows }) {
  const goToStep = useRegistrationStore((s) => s.goToStep);
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          onClick={() => goToStep(step)}
          className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="break-words text-sm font-medium text-navy-950">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ReviewSubmit() {
  const data = useRegistrationStore((s) => s.data);
  const prevStep = useRegistrationStore((s) => s.prevStep);
  const setResult = useRegistrationStore((s) => s.setResult);
  const showToast = useUiStore((s) => s.showToast);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { service, vendor, documents, uploads } = data;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await submitRegistration(data);
      setResult(result);
      showToast('Application submitted successfully!');
    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ReviewBlock
        title="Service Details"
        step={0}
        rows={[
          ['Organization Type', labelOf(ORGANIZATION_TYPES, service.organizationType)],
          ['Service', getServiceBySlug(service.service)?.title],
          ['Previous Reg. No.', service.previousRegNo],
          ...(service.query ? [['Requirement', service.query]] : []),
        ]}
      />
      <ReviewBlock
        title="Vendor Details"
        step={1}
        rows={[
          ['Full Name', vendor.fullName],
          ['Organization', vendor.organizationName],
          ['Mobile', vendor.mobile],
          ['Email', vendor.email],
          ['Address', `${vendor.address}, ${vendor.district}, ${vendor.state} - ${vendor.pincode}`],
        ]}
      />
      <ReviewBlock
        title="Document Details"
        step={2}
        rows={[
          ['ID Proof', labelOf(ID_PROOF_TYPES, documents.idProofType)],
          ['ID Number', documents.idProofNumber],
          ['PAN', documents.panNumber],
          ['GSTIN', documents.gstNumber],
        ]}
      />
      <div className="rounded-2xl border border-slate-200 p-5">
        <h3 className="mb-4 font-semibold">Uploaded Documents</h3>
        <ul className="flex flex-wrap gap-2">
          {Object.values(uploads)
            .filter(Boolean)
            .map((f) => (
              <li key={f.name} className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800">
                <FileCheck2 className="h-3.5 w-3.5" /> {f.name}
              </li>
            ))}
        </ul>
      </div>

      <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600"
        />
        <span>
          I confirm the information is correct and I agree to the{' '}
          <Link to={ROUTES.TERMS} className="font-medium text-primary-700 underline" target="_blank">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link to={ROUTES.PRIVACY_POLICY} className="font-medium text-primary-700 underline" target="_blank">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <StepActions onBack={prevStep} nextLabel="Submit Application" loading={loading} disabled={!agreed} />
    </form>
  );
}
