import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from '@/components/common/ScrollToTop';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import MobileActionBar from '@/components/common/MobileActionBar';
import CustomCursor from '@/components/common/CustomCursor';
import BackToTop from '@/components/common/BackToTop';
import PageLoader from '@/components/common/PageLoader';
import Toast from '@/components/ui/Toast';

/** Frame shared by every page: TopBar + Navbar + page content + Footer. */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <TopBar />
      <Navbar />
      <main className="-mt-16 flex-1 md:-mt-[5.75rem]">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileActionBar />
      <CustomCursor />
      <BackToTop />
      <Toast />
    </div>
  );
}
