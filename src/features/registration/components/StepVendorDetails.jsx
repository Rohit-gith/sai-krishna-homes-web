import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import StepActions from './StepActions';
import { vendorSchema } from '../utils/validation';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { INDIAN_STATES } from '@/constants/formOptions';

export default function StepVendorDetails() {
  const saved = useRegistrationStore((s) => s.data.vendor);
  const updateSection = useRegistrationStore((s) => s.updateSection);
  const nextStep = useRegistrationStore((s) => s.nextStep);
  const prevStep = useRegistrationStore((s) => s.prevStep);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(vendorSchema), defaultValues: saved });

  const onSubmit = (values) => {
    updateSection('vendor', values);
    nextStep();
  };

  const onBack = () => {
    updateSection('vendor', getValues()); // keep unsaved edits when going back
    prevStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Input label="Full Name" required placeholder="As per ID proof" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Organization / Association Name" placeholder="Optional" {...register('organizationName')} />
        <Input
          label="Mobile Number"
          required
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile"
          error={errors.mobile?.message}
          {...register('mobile')}
        />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Textarea
          label="Full Address"
          required
          rows={3}
          placeholder="House no., street, village / area"
          className="md:col-span-2"
          error={errors.address?.message}
          {...register('address')}
        />
        <Input label="District" required error={errors.district?.message} {...register('district')} />
        <Select label="State" required options={INDIAN_STATES} error={errors.state?.message} {...register('state')} />
        <Input
          label="PIN Code"
          required
          inputMode="numeric"
          maxLength={6}
          error={errors.pincode?.message}
          {...register('pincode')}
        />
      </div>
      <StepActions onBack={onBack} />
    </form>
  );
}
