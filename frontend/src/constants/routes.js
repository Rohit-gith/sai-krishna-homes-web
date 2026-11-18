/** Single source of truth for every URL in the app. */
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  SERVICE_DETAIL: '/services/:slug',
  PRODUCTS: '/products',
  ABOUT: '/about',
  REGISTER: '/register',
  APPLICATION_STATUS: '/application-status',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms-conditions',
  SAI_KRISHNA: '/saikrishna',
};

export const serviceDetailPath = (slug) => `/services/${slug}`;
