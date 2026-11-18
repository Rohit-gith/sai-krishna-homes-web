import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, AlertCircle } from 'lucide-react';
import PageHero from '@/components/common/PageHero';
import Button from '@/components/ui/Button';
import StatusSearchForm from '@/features/application-status/components/StatusSearchForm';
import StatusTimeline from '@/features/application-status/components/StatusTimeline';
import { useStatusStore } from '@/features/application-status/store/useStatusStore';
import { ROUTES } from '@/constants/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ApplicationStatusPage() {
  useDocumentTitle('Track Application');
  const [params] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const { status, application, error, search, clear } = useStatusStore();

  // Auto-search when arriving with ?q=REG_NO (e.g. from the success screen)
  useEffect(() => {
    if (initialQuery) search(initialQuery);
    else clear();
  }, [initialQuery, search, clear]);

  return (
    <>
      <PageHero
        title="Track Your Application"
        subtitle="Enter your registration number or mobile number to see the live status."
        breadcrumb="Application Status"
      />
      <section className="section bg-slate-50/70">
        <div className="container max-w-3xl space-y-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft md:p-8">
            <StatusSearchForm key={initialQuery} initialQuery={initialQuery} />
          </div>

          {status === 'loading' && (
            <div className="h-64 animate-pulse rounded-[2rem] bg-white" aria-label="Loading status" />
          )}

          {status === 'found' && application && <StatusTimeline application={application} />}

          {status === 'not-found' && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
              <SearchX className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">No application found</h2>
              <p className="mt-1 text-slate-500">Please check the number and try again, or register a new application.</p>
              <Button to={ROUTES.REGISTER} className="mt-6">
                Register Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-red-700">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
