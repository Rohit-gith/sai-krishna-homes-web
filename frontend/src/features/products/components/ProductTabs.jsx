import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PRODUCT_GROUPS } from '@/data/products';
import ProductCard from './ProductCard';
import { cn } from '@/utils/cn';

export default function ProductTabs() {
  const [active, setActive] = useState(PRODUCT_GROUPS[0].key);
  const group = PRODUCT_GROUPS.find((g) => g.key === active);

  return (
    <div>
      <div role="tablist" className="mx-auto mb-12 flex w-fit flex-wrap justify-center gap-2 rounded-full bg-slate-100 p-1.5">
        {PRODUCT_GROUPS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={cn(
              'relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
              active === key ? 'text-white' : 'text-navy-900 hover:text-primary-700',
            )}
          >
            {active === key && (
              <motion.span layoutId="product-tab" className="absolute inset-0 rounded-full bg-primary-600 shadow-md" />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          <p className="mx-auto mb-10 max-w-xl text-center text-slate-600">{group.description}</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <ProductCard key={item.name} item={item} group={group} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
