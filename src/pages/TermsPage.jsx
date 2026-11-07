import PageHero from '@/components/common/PageHero';
import LegalContent from '@/components/common/LegalContent';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// NOTE: Draft text. Have it reviewed by a legal professional before going live.
const SECTIONS = [
  {
    heading: 'Acceptance of terms',
    body: `By using this website or registering for any service, you agree to these terms set by ${COMPANY.name}.`,
  },
  {
    heading: 'Service jurisdiction',
    body: 'Our services are currently offered within India only.',
  },
  {
    heading: 'Accuracy of information',
    body: 'You are responsible for providing true and complete information. Applications with false or misleading details may be rejected.',
  },
  {
    heading: 'Fees and payments',
    body: 'Applicable service charges will be communicated before work begins. Government fees, if any, are charged separately as per actuals.',
  },
  {
    heading: 'Limitation of liability',
    body: 'Approvals by government bodies, banks or third parties are subject to their own rules; we assist with the process but cannot guarantee their decisions.',
  },
  {
    heading: 'Changes to these terms',
    body: 'We may update these terms from time to time. Continued use of the website means you accept the updated terms.',
  },
];

export default function TermsPage() {
  useDocumentTitle('Terms & Conditions');
  return (
    <>
      <PageHero title="Terms & Conditions" subtitle="Please read these terms carefully before using our services." />
      <LegalContent updated="06 Nov 2026" sections={SECTIONS} />
    </>
  );
}
