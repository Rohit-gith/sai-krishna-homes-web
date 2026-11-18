# Sai Krishna Homes: Website

Official website of **Sai Krishna Homes Pvt. Ltd.** (Bhubaneswar), built with React, Tailwind CSS, PostCSS and Zustand.

## Tech stack

| Purpose        | Library                          |
| -------------- | -------------------------------- |
| UI             | React 18 + Vite 5                |
| Styling        | Tailwind CSS 3 + PostCSS         |
| State          | Zustand                          |
| Routing        | React Router 6 (lazy-loaded pages) |
| Forms          | React Hook Form + Zod            |
| Animation      | Framer Motion                    |
| Icons          | lucide-react                     |

## Repository layout

```
apc-agencies-web/
├── frontend/   # the website + admin panel (React, Vite, Tailwind)
└── backend/    # the API (Node, Express, MongoDB): website enquiries, admin login, CRM
```

The website calls the API at `/api/*` on its own address. In development Vite forwards `/api` to the
backend on port 8787; on Vercel, `frontend/vercel.json` rewrites `/api/*` to the backend deployment.
Keeping it same-origin is what lets the admin's login cookie stay `httpOnly` and simple.

## Running locally

Two terminals:

```bash
# 1) backend
cd backend
npm install
npm run dev:memory        # throwaway in-memory MongoDB + test admin: admin@test.local / Test@12345
# or, with a real database: cp .env.example .env, fill it in, then `npm run dev`

# 2) frontend
cd frontend
npm install
npm run dev               # http://localhost:5174  (admin: /login)
```

Other commands: `frontend` → `npm run build`, `npm run lint`, `npm run format`;
`backend` → `npm test` (17 API tests on an in-memory MongoDB), `npm run create-admin -- <email> "<Name>" "<password>"`.

## Backend (API)

| Route | Who | What |
| --- | --- | --- |
| `POST /api/enquiries` | public | every website form (contact, brochure, project enquiry, site visit). Validated, rate-limited (8 per IP / 10 min), honeypot, emails the owner |
| `POST /api/auth/login` · `logout` · `GET me` | admin | bcrypt passwords, 8-hour JWT in an `httpOnly` cookie, 6 tries / 15 min |
| `GET/PATCH/DELETE /api/enquiries/:id` | admin | enquiries inbox |
| `/api/leads` (+ `/status`, `/:id/commit`, `/:id/reopen`, `/:id/attempts`, `/import`, `/delete`) | admin | CRM: pipeline, won/lost, attempts, Excel import |

MongoDB collections: `enquiries`, `leads`, `admins`, `counters` (lead numbers SKH-0001…), `ratelimits` (self-expiring).

### Deploying (two Vercel projects from this one repo)

1. **MongoDB Atlas**: create a free cluster, a database user, and allow access from anywhere (`0.0.0.0/0`, Vercel has no fixed IP). Copy the connection string.
2. **Backend project** on Vercel: import the repo, *Root Directory* = `backend`, project name `sai-krishna-homes-api`. Add the variables from `backend/.env.example` (`MONGODB_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, and the `SMTP_*` / `ALERT_TO` ones for email alerts).
3. **Frontend project** (the existing one): *Root Directory* = `frontend`. If the backend got a different URL, update it in `frontend/vercel.json`.
4. Create each admin login once: `cd backend && npm run create-admin -- name@example.com "Full Name" "a-strong-password"` (with `.env` pointing at Atlas).

## Frontend folder structure (`frontend/`)

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
├── services/             # API layer (crmApi.js talks to ../backend)
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
