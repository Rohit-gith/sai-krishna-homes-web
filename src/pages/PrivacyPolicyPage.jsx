import PageHero from '@/components/common/PageHero';
import LegalContent from '@/components/common/LegalContent';
import { COMPANY } from '@/data/companyInfo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// NOTE: Draft text. Have it reviewed by a legal professional before going live.
const SECTIONS = [
  {
    heading: 'Information we collect',
    body: 'When you register or contact us, we collect details such as your name, mobile number, email, address, identity document numbers and the documents you upload.',
  },
  {
    heading: 'How we use your information',
    body: 'Your information is used only to process your application, verify your identity, deliver the requested service and contact you about it.',
  },
  {
    heading: 'Data security',
    body: 'We use reasonable technical and organisational measures to protect your data against unauthorised access, loss or misuse.',
  },
  {
    heading: 'Sharing of information',
    body: 'We do not sell your personal data. Information may be shared with government departments, laboratories or partners only when required to deliver your service, or when required by law.',
  },
  {
    heading: 'Your rights',
    body: 'You may request access to, correction of, or deletion of your personal data by contacting us.',
  },
  {
    heading: 'Contact',
    body: `For any privacy questions, write to us at ${COMPANY.email} or call ${COMPANY.phoneDisplay}.`,
  },
];

export default function PrivacyPolicyPage() {
  useDocumentTitle('Privacy Policy');
  return (
    <>
      <PageHero title="Privacy Policy" subtitle="How we collect, use and protect your information." />
      <LegalContent updated="06 Nov 2026" sections={SECTIONS} />
    </>
  );
}
