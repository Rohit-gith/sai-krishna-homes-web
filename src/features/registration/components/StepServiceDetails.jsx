import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import StepActions from './StepActions';
import { serviceSchema } from '../utils/validation';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { ORGANIZATION_TYPES } from '@/constants/formOptions';
import { SERVICES } from '@/data/services';

const SERVICE_OPTIONS = SERVICES.map((s) => ({ value: s.slug, label: s.title }));

export default function StepServiceDetails() {
  const saved = useRegistrationStore((s) => s.data.service);
  const updateSection = useRegistrationStore((s) => s.updateSection);
  const nextStep = useRegistrationStore((s) => s.nextStep);
  const [params] = useSearchParams();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(serviceSchema), defaultValues: saved });

  // Pre-select service when coming from "Apply Now" (/register?service=slug)
  useEffect(() => {
    const slug = params.get('service');
    if (slug && SERVICES.some((s) => s.slug === slug)) setValue('service', slug);
  }, [params, setValue]);

  const selectedService = watch('service');

  const onSubmit = (values) => {
    updateSection('service', values);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Previous Registration Number"
          placeholder="e.g. SKH2026-1001"
          hint="Only if you have registered with us earlier"
          className="md:col-span-2"
          {...register('previousRegNo')}
        />
        <Select
          label="Organization Type"
          required
          options={ORGANIZATION_TYPES}
          error={errors.organizationType?.message}
          {...register('organizationType')}
        />
        <Select
          label="Service Required"
          required
          options={SERVICE_OPTIONS}
          error={errors.service?.message}
          {...register('service')}
        />
        {selectedService === 'other-services' && (
          <Textarea
            label="Describe your requirement"
            required
            placeholder="Tell us what service you need…"
            className="md:col-span-2"
            error={errors.query?.message}
            {...register('query')}
          />
        )}
      </div>
      <StepActions />
    </form>
  );
}
