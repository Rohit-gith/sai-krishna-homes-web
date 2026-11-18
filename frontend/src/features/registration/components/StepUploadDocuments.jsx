import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import StepActions from './StepActions';
import { REQUIRED_UPLOADS } from '../utils/validation';
import { useRegistrationStore } from '../store/useRegistrationStore';

export default function StepUploadDocuments() {
  const uploads = useRegistrationStore((s) => s.data.uploads);
  const setUpload = useRegistrationStore((s) => s.setUpload);
  const nextStep = useRegistrationStore((s) => s.nextStep);
  const prevStep = useRegistrationStore((s) => s.prevStep);
  const [errors, setErrors] = useState({});

  const onSubmit = (e) => {
    e.preventDefault();
    const missing = {};
    REQUIRED_UPLOADS.forEach(({ key, label }) => {
      if (!uploads[key]) missing[key] = `${label} is required`;
    });
    setErrors(missing);
    if (Object.keys(missing).length === 0) nextStep();
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-primary-50 p-4 text-sm text-primary-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
        Your documents are used only to verify your application and are kept secure.
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {REQUIRED_UPLOADS.map(({ key, label }) => (
          <FileUpload
            key={key}
            label={label}
            required
            accept={key === 'photo' ? '.jpg,.jpeg,.png' : undefined}
            value={uploads[key]}
            error={errors[key]}
            onChange={(file) => {
              setUpload(key, file);
              if (file) setErrors((e) => ({ ...e, [key]: undefined }));
            }}
          />
        ))}
        <FileUpload label="Other Document (optional)" value={uploads.other} onChange={(f) => setUpload('other', f)} />
      </div>
      <StepActions onBack={prevStep} nextLabel="Review Application" />
    </form>
  );
}
