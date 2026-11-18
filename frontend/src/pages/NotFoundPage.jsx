import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  const navigate = useNavigate();
  return (
    <section className="flex min-h-[80vh] items-center pt-24">
      <div className="container text-center">
        <p className="text-gradient font-display text-8xl font-extrabold md:text-9xl">404</p>
        <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for doesn't exist or has been moved.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button to={ROUTES.HOME}>
            <Home className="h-4 w-4" /> Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    </section>
  );
}
