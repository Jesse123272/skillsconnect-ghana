# 🇬🇭 SkillsConnect Ghana

**SkillsConnect Ghana** is a full-stack web application that connects verified Ghanaian artisans — electricians, plumbers, carpenters, tailors, mechanics, beauticians, and more — with customers across all 16 regions of Ghana.

The platform provides a secure, reliable marketplace with AI-powered artisan matching, direct enquiries, Paystack Mobile Money & Card payments, customer reviews, and an admin control panel.

🌐 **Live:** https://skillsconnect-ghana-delta.vercel.app

---

## ✨ Features

### 👤 For Customers
- **Artisan Directory** — Search by trade, region, district, rating, and keywords
- **AI Matchmaker** — Describe your project in plain language for instant AI-recommended artisans
- **Enquiries & Messaging** — Send job requests and communicate directly with artisans
- **Secure Payments** — Pay via Paystack (MTN MoMo, Telecel Cash, AT Money, Bank Cards)
- **Ratings & Reviews** — Rate completed jobs and read authentic feedback
- **Payment Receipts** — Access printable receipts and transaction history

### 🔧 For Artisans
- **Profile & Portfolio** — Showcase trade skills, experience, service areas, and work photos
- **Enquiry Management** — Receive job requests, update status, and chat with clients
- **Earnings Tracking** — View received payments and transaction records
- **Verification Badge** — Build trust through admin-verified profile approval

### 🛡️ For Administrators
- **Dashboard** — Monitor platform metrics, registrations, and system activity
- **Artisan Approval** — Review and approve artisan profiles before they go live
- **User & Category Management** — Manage accounts, trade categories, and content

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| Styling | Bootstrap 5, Tailwind CSS, Poppins font, Font Awesome 6 |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) with SQLite dev fallback |
| Auth | Custom JWT (`jose`, `bcryptjs`) with HTTP-only cookies |
| Payments | [Paystack](https://paystack.com/) Ghana (Mobile Money + Cards) |
| AI | Google Gemini API (`@google/genai`) |
| Hosting | [Vercel](https://vercel.com/) (serverless) |
| Email | Zoho Mail SMTP |
| File Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 LTS (v20.x recommended — v26 has a known Supabase DNS bug)
- npm v10+
- A free [Supabase](https://supabase.com/) account for the database

### 1. Clone the repository

```bash
git clone https://github.com/Jesse123272/skillsconnect-ghana.git
cd skillsconnect-ghana
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema from:
   ```
   database/skillsconnect_postgres.sql
   ```
   This creates all tables, indexes, 20 trade categories, and the admin account.

3. Go to **Project Settings → Database → Connection string → URI** and copy it.

### 4. Configure environment variables

Create `.env.local` in the project root:

```env
# ── Supabase / PostgreSQL ──────────────────────────────────────────
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_POOLER_HOST="aws-0-[YOUR-REGION].pooler.supabase.com"
SUPABASE_POOLER_IPS="[IP1],[IP2],[IP3]"   # resolve: nslookup aws-0-[region].pooler.supabase.com
USE_SQLITE="false"

# ── Authentication ─────────────────────────────────────────────────
JWT_SECRET=your_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=90d
APP_URL=http://localhost:3000

# ── Paystack ───────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_live_xxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx

# ── Google Gemini AI ───────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ── Email (Zoho Mail) ─────────────────────────────────────────────
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USER=your@zohomail.com
EMAIL_PASS=your_zoho_app_password
EMAIL_FROM="SkillsConnect Ghana <your@zohomail.com>"

# ── Vercel Blob (file uploads) ────────────────────────────────────
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxx
```

> **Note on SUPABASE_POOLER_IPS:** This is needed for local development only (Node.js dev server DNS sandbox quirk). On Vercel production this is not required.

### 5. Run the development server

```bash
npm run dev -- --webpack
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Why `--webpack`?** Next.js 16 defaults to Turbopack in dev. This project has a custom webpack config — the flag keeps dev and build behaviour consistent.

---

## 🔑 Admin Access

After running the SQL schema, an admin account is created automatically:

| Field | Value |
|---|---|
| URL | `/admin/login` |
| Email | `admin@skillsconnect.gh` |
| Password | `Admin@SkillsConnect2026` |

> Change the password immediately after first login via the admin settings panel.

---

## 🗄️ Database

The project uses **Supabase (PostgreSQL)** as the primary database.

- Full schema: `database/skillsconnect_postgres.sql`
- Run this file in the Supabase SQL Editor to set up all tables
- In development without Supabase configured, the app falls back to **SQLite** automatically (`USE_SQLITE=true`)

### Tables

| Table | Description |
|---|---|
| `users` | Customers, artisans, and admins |
| `categories` | 20 trade categories (pre-seeded) |
| `artisan_profiles` | Artisan profile data and ratings |
| `enquiries` | Job requests between customers and artisans |
| `enquiry_messages` | Message threads per enquiry |
| `reviews` | Customer ratings and feedback |
| `transactions` | Paystack payment records |
| `notifications` | In-app notification system |
| `portfolio_items` | Artisan work portfolio images |
| `saved_artisans` | Customer bookmarked artisans |
| `testimonials` | Platform-level testimonials |
| `guarantors` | Artisan professional references |
| `activity_logs` | Admin audit trail |

---

## 🌍 Deploying to Vercel

The project is pre-configured for Vercel deployment. Since the GitHub repo is linked to Vercel, every push to `master` triggers an automatic deployment.

### Environment variables on Vercel

Go to your [Vercel project dashboard](https://vercel.com/dashboard) → **Settings → Environment Variables** and add:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Your Supabase PostgreSQL URI |
| `SUPABASE_POOLER_HOST` | ✅ | e.g. `aws-0-eu-west-1.pooler.supabase.com` |
| `USE_SQLITE` | ✅ | Set to `false` |
| `JWT_SECRET` | ✅ | Minimum 32 characters |
| `JWT_EXPIRES_IN` | ✅ | e.g. `90d` |
| `APP_URL` | ✅ | Your Vercel URL |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Same as APP_URL |
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack live secret key |
| `PAYSTACK_PUBLIC_KEY` | ✅ | Paystack live public key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ | Same as PAYSTACK_PUBLIC_KEY |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `EMAIL_HOST` | ✅ | SMTP host |
| `EMAIL_PORT` | ✅ | Usually `587` |
| `EMAIL_USER` | ✅ | SMTP username |
| `EMAIL_PASS` | ✅ | SMTP password / app password |
| `EMAIL_FROM` | ✅ | Sender name and email |
| `BLOB_READ_WRITE_TOKEN` | ✅ | Vercel Blob token for uploads |

> `SUPABASE_POOLER_IPS` is **not needed** on Vercel — DNS works fine in production.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev -- --webpack` | Start development server |
| `npm run build -- --webpack` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |

---

## 📁 Project Structure

```text
skillsconnect-ghana/
├── app/
│   ├── api/                  # API routes (auth, artisans, payments, admin…)
│   ├── admin/                # Admin login page
│   ├── artisan/              # Public artisan profile pages
│   ├── browse/               # Artisan directory with filters
│   ├── dashboard/            # Role dashboards (customer, artisan, admin)
│   ├── login/                # User login
│   ├── register/             # Registration (customer & artisan)
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout + design system CSS variables
│   └── page.js               # Homepage
├── components/               # Reusable UI components
├── context/                  # React Context (AuthContext)
├── database/
│   ├── skillsconnect_postgres.sql   # PostgreSQL schema (Supabase)
│   └── skillsconnect.sql            # Legacy MySQL/SQLite schema
├── lib/
│   ├── db.js                 # Database layer (PostgreSQL + SQLite fallback)
│   ├── auth.js               # JWT helpers
│   ├── mailer.js             # Email via SMTP
│   └── sqlite-fallback.mjs  # Local SQLite fallback
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
└── README.md                 # This file
```

---

## 🔒 Security

- All secret keys stay server-side — never exposed to the browser
- Passwords hashed with `bcryptjs` (12 rounds)
- Authentication via HTTP-only JWT cookies
- Input sanitised before all database queries
- SQL injection protection via parameterised queries

---

## 👥 Contributors

| Name | Role |
|---|---|
| Kojo Asirifi Nyarko | Lead Developer |
| Agyepong Felix Okoree | Product Designer |
| Richmond Nkansah | Backend Engineer |

---

## 📫 Contact

- **Email:** skillsconnectgh@zohomail.com
- **Phone:** +233 530 600 127
- **Location:** Accra, Greater Accra, Ghana

---

## 📄 License

This project is licensed under the **MIT License**.
