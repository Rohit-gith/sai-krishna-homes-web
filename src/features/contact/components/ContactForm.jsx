import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { COMPANY } from '@/data/companyInfo';
import { whatsappLink } from '@/utils/whatsapp';
import { useUiStore } from '@/store/useUiStore';
import { useCrmStore } from '@/features/admin/store/useCrmStore';

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')),
  interest: z.string().optional(),
  message: z.string().trim().min(3, 'Please write a short message'),
});

const INTEREST_OPTIONS = [
  'Panchawati Residency',
  'Sai Krishna Residency',
  'Studio apartment',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  'Commercial space',
  'Site visit',
  'Home loan help',
].map((v) => ({ value: v, label: v }));

/** Opens WhatsApp (app on phones, WhatsApp Web on desktop) with the enquiry pre-filled. */
function openWhatsApp(text) {
  const url = whatsappLink(text);
  // Note: passing 'noopener' makes window.open() always return null, so detach the opener manually.
  const win = window.open(url, '_blank');
  if (win) {
    win.opener = null;
  } else {
    // Popup genuinely blocked (some mobile browsers): fall back to the same tab.
    window.location.href = url;
  }
}

export default function ContactForm() {
  const showToast = useUiStore((s) => s.showToast);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', mobile: '', email: '', interest: '', message: '' } });

  const onSubmit = ({ name, mobile, email, interest, message }) => {
    const lines = [
      `Hello ${COMPANY.shortName}, I have an enquiry from your website.`,
      '',
      `Name: ${name.trim()}`,
      `Mobile: +91 ${mobile}`,
      email ? `Email: ${email.trim()}` : null,
      interest ? `Interested in: ${interest}` : null,
      '',
      `Message: ${message.trim()}`,
    ].filter((l) => l !== null);
    useCrmStore.getState().captureEnquiry({
      form: 'Contact form',
      name: name.trim(),
      phone: mobile,
      email: email.trim(),
      interest,
      message: message.trim(),
    });
    openWhatsApp(lines.join('\n'));
    showToast('Opening WhatsApp. Just tap Send there to reach our team.');
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      <Input label="Your Name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input
        label="Mobile Number"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        error={errors.mobile?.message}
        {...register('mobile')}
      />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Select label="Interested In" placeholder="Select (optional)" options={INTEREST_OPTIONS} {...register('interest')} />
      <Textarea
        label="Message"
        required
        rows={5}
        placeholder="How can we help you?"
        className="sm:col-span-2"
        error={errors.message?.message}
        {...register('message')}
      />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
          {!isSubmitting && <Send className="h-4 w-4" />} Send on WhatsApp
        </Button>
        <p className="mt-3 text-[13px] text-slate-500">
          Your message opens in WhatsApp, pre-filled. Tap send there to reach us at {COMPANY.phoneDisplay}.
        </p>
      </div>
    </form>
  );
}
