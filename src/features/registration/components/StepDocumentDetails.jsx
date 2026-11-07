import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StepActions from './StepActions';
import { documentSchema } from '../utils/validation';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { ID_PROOF_TYPES } from '@/constants/formOptions';

export default function StepDocumentDetails() {
  const saved = useRegistrationStore((s) => s.data.documents);
  const updateSection = useRegistrationStore((s) => s.updateSection);
  const nextStep = useRegistrationStore((s) => s.nextStep);
  const prevStep = useRegistrationStore((s) => s.prevStep);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(documentSchema), defaultValues: saved });

  const onSubmit = (values) => {
    updateSection('documents', values);
    nextStep();
  };

  const onBack = () => {
    updateSection('documents', getValues());
    prevStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="ID Proof Type"
          required
          options={ID_PROOF_TYPES}
          error={errors.idProofType?.message}
          {...register('idProofType')}
        />
        <Input label="ID Proof Number" required error={errors.idProofNumber?.message} {...register('idProofNumber')} />
        <Input
          label="PAN Number"
          placeholder="ABCDE1234F"
          hint="Optional"
          className="[&_input]:uppercase"
          error={errors.panNumber?.message}
          {...register('panNumber')}
        />
        <Input
          label="GST Number"
          placeholder="22ABCDE1234F1Z5"
          hint="Optional, for registered businesses"
          className="[&_input]:uppercase"
          error={errors.gstNumber?.message}
          {...register('gstNumber')}
        />
      </div>
      <StepActions onBack={onBack} />
    </form>
  );
}
