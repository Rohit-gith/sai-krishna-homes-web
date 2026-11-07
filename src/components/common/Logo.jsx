import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import logoImg from '@/assets/logo/logo.png';

/**
 * Brand logo: Sai Krishna Homes building mark (from the client's official logo) + wordmark.
 * The source image has "SAI KRISHNA HOMES" printed under the mark; we crop it off and render the
 * name as real text so it stays sharp and readable at navbar size.
 */
export default function Logo({ light = false, className }) {
  return (
    <Link to={ROUTES.HOME} className={cn('flex items-center gap-2.5', className)} aria-label="Sai Krishna Homes home">
      <span className="block h-[2.4rem] w-10 shrink-0 overflow-hidden">
        <img src={logoImg} alt="" className="h-auto w-10 max-w-none" />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            'block font-serif text-[1.3rem] font-semibold tracking-[0.14em]',
            light ? 'text-white' : 'text-navy-950',
          )}
        >
          SAI KRISHNA
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[10px] font-bold uppercase tracking-[0.5em]',
            light ? 'text-amber-400' : 'text-amber-600',
          )}
        >
          Homes
        </span>
      </span>
    </Link>
  );
}
