import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';

/** Banner at the top of every inner page with breadcrumb. */
export default function PageHero({ title, subtitle, breadcrumb }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 pb-16 pt-36 md:pb-20 md:pt-44">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="container relative">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-slate-400">
          <Link to={ROUTES.HOME} className="-my-3 py-3 pr-2 hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-primary-300">{breadcrumb || title}</span>
        </nav>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-4xl font-bold text-white md:text-5xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 max-w-2xl text-lg text-slate-300"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
