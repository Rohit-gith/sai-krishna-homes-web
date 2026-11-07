import { useCallback, useEffect, useState } from 'react';
import SkNavbar from '@/features/saikrishna/components/SkNavbar';
import SkHero from '@/features/saikrishna/components/SkHero';
import SkEnquiryModal from '@/features/saikrishna/components/SkEnquiryModal';

/** Standalone luxury landing page for Sai Krishna Homes (does not use the shared layout). */
export default function SaiKrishnaPage() {
  const [enquiry, setEnquiry] = useState({ open: false, project: undefined });

  const openEnquiry = useCallback((project) => setEnquiry({ open: true, project }), []);
  const closeEnquiry = useCallback(() => setEnquiry((e) => ({ ...e, open: false })), []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Sai Krishna Homes | Luxury Township in Bhubaneswar';
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-sk-ink font-lux text-sk-ivory selection:bg-sk-gold selection:text-sk-ink">
      <SkNavbar onEnquire={() => openEnquiry()} />
      <main>
        <SkHero onEnquire={openEnquiry} />
      </main>
      <SkEnquiryModal open={enquiry.open} defaultProject={enquiry.project} onClose={closeEnquiry} />
    </div>
  );
}
