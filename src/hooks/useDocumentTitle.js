import { useEffect } from 'react';
import { COMPANY } from '@/data/companyInfo';

/** Sets the browser tab title for the current page (basic SEO). */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${COMPANY.shortName}` : `${COMPANY.shortName} | Premium Residences in Bhubaneswar`;
  }, [title]);
}
