# Sai Krishna Homes: Website

Official website of **Sai Krishna Homes Pvt. Ltd.** (Bhubaneswar), built with React, Tailwind CSS, PostCSS and Zustand.

## Tech stack

| Purpose        | Library                          |
| -------------- | -------------------------------- |
| UI             | React 18 + Vite 5                |
| Styling        | Tailwind CSS 3 + PostCSS         |
| State          | Zustand (with `persist` for drafts) |
| Routing        | React Router 6 (lazy-loaded pages) |
| Forms          | React Hook Form + Zod            |
| Animation      | Framer Motion                    |
| Icons          | lucide-react                     |

## Getting started

```bash
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
npm run build            # production build in /dist
npm run preview          # preview the production build
npm run lint             # ESLint
npm run format           # Prettier
```

## Folder structure

```
src/
├── app/                  # App root + router
├── assets/               # images, icons, logo
├── components/
│   ├── ui/               # Design-system building blocks (Button, Input, Stepper…)
│   ├── layout/           # TopBar, Navbar, Footer, MainLayout
│   └── common/           # Shared sections (PageHero, CtaSection, Reveal…)
├── features/             # Feature modules: each owns its components, store, utils
│   ├── home/             # Landing page sections (HeroSection, Stats, FAQ…)
│   ├── services/         # Service cards & filter
│   ├── products/         # Product tabs & cards
│   ├── registration/     # 4-step registration wizard + Zustand store + Zod schemas
│   ├── application-status/ # Status search + timeline
│   └── contact/          # Contact form & info cards
├── pages/                # One file per route; composes features
├── services/             # API layer (mock until backend is ready)
├── store/                # Global Zustand stores (UI: menu, toasts)
├── data/                 # Editable content (services, products, FAQs, company info)
├── constants/            # Routes, nav links, form options
├── hooks/                # Custom hooks
├── utils/                # Helpers (cn, formatDate)
└── styles/               # Tailwind entry + global CSS
```

### Where do I change…?

| I want to change…              | File                                   |
| ------------------------------ | -------------------------------------- |
| Phone / email / CIN            | `src/data/companyInfo.js`              |
| List of services               | `src/data/services.js`                 |
| Products                       | `src/data/products.js`                 |
| FAQs / testimonials            | `src/data/faqs.js`, `testimonials.js`  |
| Brand colours & fonts          | `tailwind.config.cjs`                  |
| Navbar / footer links          | `src/constants/navLinks.js`            |
| Home hero section              | `src/features/home/components/HeroSection.jsx` |
| Registration form fields/rules | `src/features/registration/`           |

## Mock API → real backend

All network calls live in `src/services/`. While `VITE_USE_MOCK_API` is not `false`,
responses are simulated and stored in `localStorage` (`src/services/mockDb.js`).

When the backend is ready:

1. Set `VITE_API_BASE_URL=https://api.example.com` and `VITE_USE_MOCK_API=false` in `.env`.
2. Make sure the endpoints match those in `registrationApi.js`, `statusApi.js`, `contactApi.js`.
3. Upload real files: the registration store keeps only file metadata, so send the actual `File`
   objects via `FormData` in `submitRegistration`.
4. Delete `mockDb.js`.

Demo registration numbers for testing status: `SKH2026-1001`, `SKH2026-1002`.

## Before going live

- [ ] Replace placeholder logo (`src/components/common/Logo.jsx`) with the real logo
- [ ] Add real product photos and team images to `src/assets/images`
- [ ] Replace placeholder testimonials and statistics with real data
- [ ] Add the office address in `companyInfo.js` and social media links
- [ ] Get Privacy Policy and Terms reviewed by a legal professional
