import { useEffect } from 'react';
import { Save, Phone } from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import RegistrationWizard from '@/features/registration/components/RegistrationWizard';
import { useRegistrationStore } from '@/features/registration/store/useRegistrationStore';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function RegisterPage() {
  useDocumentTitle('Register');
  useEffect(() => {
    const { currentStep, result } = useRegistrationStore.getState();
    if (currentStep > 0 && !result) window.scrollTo({ top: 300 });
  }, []);

  return (
    <>
      <PageHero
        title="Registration Form"
        subtitle="Register in 4 easy steps. Your progress is saved automatically."
        breadcrumb="Register"
      />
      <section className="section bg-slate-50/70">
        <div className="container max-w-4xl">
          <RegistrationWizard />
          <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-slate-500 sm:flex-row sm:gap-8">
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4 text-primary-600" /> Draft auto-saved on this device
            </span>
            <a href={`tel:${COMPANY.phone}`} className="flex items-center gap-2 hover:text-primary-700">
              <Phone className="h-4 w-4 text-primary-600" /> Need help? {COMPANY.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
