import { COMPANY } from '@/data/companyInfo';

/** WhatsApp chat link to the sales team with a pre-filled message. */
export const whatsappLink = (message) => `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(message)}`;
