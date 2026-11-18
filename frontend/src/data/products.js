import { Leaf, Milk, Factory } from 'lucide-react';

export const PRODUCT_GROUPS = [
  {
    key: 'agricultural',
    label: 'Agricultural',
    icon: Leaf,
    description: 'Organic inputs that improve soil health and crop yield naturally.',
    color: 'from-primary-500 to-primary-700',
    items: [
      { name: 'Vermicompost', note: 'Nutrient-rich organic compost made by earthworms.' },
      { name: 'Organic Manure', note: 'Improves soil structure and long-term fertility.' },
      { name: 'Bio-Fertilizer', note: 'Living microbes that boost natural nutrient uptake.' },
    ],
  },
  {
    key: 'food',
    label: 'Food & Dairy',
    icon: Milk,
    description: 'Fresh, hygienic dairy products sourced from local farmers.',
    color: 'from-accent-400 to-accent-600',
    items: [
      { name: 'Spiced Buttermilk', note: 'Refreshing, traditional chaas with natural spices.' },
      { name: 'Khoa', note: 'Pure, slow-cooked milk solids for sweets.' },
      { name: 'Pedha', note: 'Traditional milk sweet made from fresh khoa.' },
      { name: 'Curd', note: 'Thick, naturally set curd.' },
      { name: 'Natural Milk', note: 'Fresh farm milk with no additives.' },
    ],
  },
  {
    key: 'industrial',
    label: 'Industrial',
    icon: Factory,
    description: 'Reliable industrial supplies for energy and electrical work.',
    color: 'from-navy-500 to-navy-700',
    items: [
      { name: 'Distilled Water', note: 'For batteries, labs and industrial use.' },
      { name: 'Engine Coolant', note: 'Keeps engines running at the right temperature.' },
      { name: 'Solar Mounting Channels', note: 'Durable structures and fixtures for solar panels.' },
      { name: 'Electrical Accessories', note: 'Quality installation accessories.' },
    ],
  },
];
