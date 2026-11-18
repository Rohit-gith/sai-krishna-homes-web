import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const VARIANTS = {
  primary:
    'bg-navy-900 text-white shadow-lg shadow-navy-900/25 hover:bg-navy-800 hover:shadow-navy-800/30',
  gold: 'bg-gradient-to-r from-primary-600 to-primary-400 text-navy-950 shadow-gold hover:brightness-105',
  secondary: 'bg-navy-950 text-white hover:bg-navy-800',
  outline: 'border border-navy-900/25 bg-transparent text-navy-950 hover:border-primary-500 hover:text-primary-700',
  ghost: 'text-navy-900 hover:bg-slate-100',
  white: 'bg-white text-navy-950 shadow-lg hover:bg-primary-50',
};

const SIZES = {
  sm: 'h-10 px-5 text-[11px]',
  md: 'h-12 px-7 text-xs',
  lg: 'h-14 px-9 text-[13px]',
};

/**
 * Reusable button.
 * - Pass `to` to render a router <Link>, `href` for an external <a>.
 * - Pass `loading` to show a spinner and disable it.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, href, loading, disabled, className, children, ...props },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2.5 rounded-[2px] font-bold uppercase tracking-[0.14em] transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/30',
    'disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...(external && { target: '_blank', rel: 'noreferrer' })}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export default Button;
