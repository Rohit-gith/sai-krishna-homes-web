import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { can, isManager } from '../access';

/**
 * Wrap a page that needs a permission (perm="enquiries.view") or the owner (manager).
 * Without it the person sees a clear "no access" message instead of a broken page.
 */
export default function RequireAccess({ perm, anyOf, manager = false, children }) {
  const user = useAuthStore((s) => s.user);
  const allowed = manager
    ? isManager(user)
    : anyOf
      ? anyOf.some((p) => can(user, p))
      : perm
        ? can(user, perm)
        : true;
  if (allowed) return children;
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Lock className="h-5 w-5 text-slate-500" />
      </span>
      <p className="mt-4 font-semibold text-navy-950">You don’t have access to this page.</p>
      <p className="mt-1 text-sm text-slate-500">
        Only the owner can give you access. Ask them if you need it.
      </p>
      <Link
        to="/admin"
        className="mt-5 inline-block rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
