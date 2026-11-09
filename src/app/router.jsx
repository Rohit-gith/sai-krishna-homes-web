import { lazy as reactLazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ROUTES } from '@/constants/routes';
import PageLoader from '@/components/common/PageLoader';

/**
 * lazy() that survives a new deploy (or a dev-server restart): if a page's file can no longer be
 * fetched because the open tab still points at the old build, reload once to pick up the new one
 * instead of showing an error. The flag stops a reload loop if the file is truly missing.
 */
const RELOAD_FLAG = 'skh_chunk_reload';
const lazy = (load) =>
  reactLazy(() =>
    load()
      .then((m) => {
        try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* storage blocked */ }
        return m;
      })
      .catch((err) => {
        let reloaded = false;
        try { reloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'; sessionStorage.setItem(RELOAD_FLAG, '1'); } catch { /* storage blocked */ }
        if (!reloaded) {
          window.location.reload();
          return new Promise(() => {}); // keep showing the loader until the reload happens
        }
        throw err;
      }),
  );

// Pages are lazy-loaded so each page downloads only when visited.
const HomePage = lazy(() => import('@/pages/HomePage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ApplicationStatusPage = lazy(() => import('@/pages/ApplicationStatusPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const SaiKrishnaPage = lazy(() => import('@/pages/SaiKrishnaPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const AdminLayout = lazy(() => import('@/features/admin/components/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const LeadsPage = lazy(() => import('@/pages/admin/LeadsPage'));
const LeadDetailPage = lazy(() => import('@/pages/admin/LeadDetailPage'));
const AttemptsPage = lazy(() => import('@/pages/admin/AttemptsPage'));
const EnquiriesPage = lazy(() => import('@/pages/admin/EnquiriesPage'));

const withLoader = (el) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const router = createBrowserRouter([
  // Admin CRM (own layout, login required)
  { path: '/login', element: withLoader(<LoginPage />) },
  {
    path: '/admin',
    element: withLoader(<AdminLayout />),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'leads/:id', element: <LeadDetailPage /> },
      { path: 'attempts', element: <AttemptsPage /> },
      { path: 'enquiries', element: <EnquiriesPage /> },
    ],
  },
  // Client landing page with its own luxury layout (no shared navbar/footer).
  {
    path: ROUTES.SAI_KRISHNA,
    element: (
      <Suspense fallback={<PageLoader />}>
        <SaiKrishnaPage />
      </Suspense>
    ),
  },
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.SERVICES, element: <ServicesPage /> },
      { path: ROUTES.SERVICE_DETAIL, element: <ServiceDetailPage /> },
      { path: ROUTES.PRODUCTS, element: <ProductsPage /> },
      { path: ROUTES.ABOUT, element: <AboutPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.APPLICATION_STATUS, element: <ApplicationStatusPage /> },
      { path: ROUTES.CONTACT, element: <ContactPage /> },
      { path: '/explore/:slug', element: <ExplorePage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:slug', element: <ProjectDetailPage /> },
      { path: ROUTES.PRIVACY_POLICY, element: <PrivacyPolicyPage /> },
      { path: ROUTES.TERMS, element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], {
  // Opt in to React Router v7 behaviour now (silences the future-flag console warnings).
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
