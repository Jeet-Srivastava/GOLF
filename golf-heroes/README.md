# ⛳ Golf Heroes

> A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

Built with **Next.js 16**, **Supabase**, **Tailwind CSS 4**, and **Framer Motion**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏌️ Score Tracking | Log Stableford scores (1–45). Top 5 become your draw numbers. |
| 🎰 Monthly Draws | Random or algorithmic draw engine. Match 3, 4, or 5 numbers to win. |
| ❤️ Charity Giving | 10%+ of every subscription goes to your chosen charity. |
| 🏆 Prize Pools | 40% (5-match jackpot), 35% (4-match), 25% (3-match). |
| 🔄 Jackpot Rollover | If no 5-match winner, the jackpot rolls to next month! |
| 👤 User Dashboard | Scores, draws, winnings, charity, and profile management. |
| 🔐 Admin Panel | User management, draw execution, charity CRUD, winner verification. |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd golf-heroes
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up the Database

Run the schema against your Supabase project using the Supabase CLI:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db query --linked -f supabase/schema.sql
```

Or paste `supabase/schema.sql` into the Supabase SQL Editor.

### 4. Create an Admin User

After signing up through the app, run this in the Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage
│   ├── how-it-works/page.tsx     # How it works
│   ├── charities/page.tsx        # Charity directory
│   ├── charities/[slug]/         # Individual charity
│   ├── auth/
│   │   ├── login/page.tsx        # Login
│   │   ├── signup/page.tsx       # Multi-step signup
│   │   └── callback/route.ts     # Auth callback
│   ├── dashboard/
│   │   ├── page.tsx              # Overview
│   │   ├── scores/page.tsx       # Score management
│   │   ├── draws/page.tsx        # View draws
│   │   ├── charity/page.tsx      # Charity selection
│   │   ├── winnings/page.tsx     # Winnings + proof upload
│   │   └── profile/page.tsx      # Account settings
│   ├── admin/
│   │   ├── page.tsx              # Admin overview
│   │   ├── users/page.tsx        # User management
│   │   ├── draws/page.tsx        # Draw engine
│   │   ├── charities/page.tsx    # Charity CRUD
│   │   └── winners/page.tsx      # Winner verification
│   └── api/
│       ├── scores/               # Scores CRUD
│       ├── charities/            # Charities CRUD
│       ├── subscription/         # Subscription API
│       ├── draws/                # Draws API
│       ├── winners/              # Winners API
│       ├── donations/            # Donations API
│       └── admin/stats/          # Admin analytics
├── components/
│   ├── ui/                       # Button, Card, Input, Badge, Modal, Toast, Loading
│   └── layout/                   # Navbar, Footer, Sidebar
├── lib/
│   ├── supabase/client.ts        # Browser Supabase client
│   ├── supabase/server.ts        # Server Supabase client
│   ├── auth.ts                   # Server-side auth helpers
│   └── draw-engine.ts            # Draw logic + prize calculations
├── types/
│   ├── database.ts               # Database schema types
│   └── index.ts                  # App types + constants
└── config/
    └── site.ts                   # Site-wide configuration
```

---

## 🎮 The Draw Engine

Located in `src/lib/draw-engine.ts`, the engine supports two modes:

| Mode | Description |
|---|---|
| **Random** | 5 completely random numbers (1–45) — standard lottery style |
| **Algorithmic** | Weighted selection based on frequency of submitted scores — slightly more fair |

### Prize Distribution

| Match | Pool % | Rollover? |
|---|---|---|
| 5 Numbers | 40% | ✅ Yes (jackpot rolls if no winner) |
| 4 Numbers | 35% | ❌ Split equally |
| 3 Numbers | 25% | ❌ Split equally |

---

## 🛡️ Security

- **Row Level Security (RLS)** on all tables
- Admin check via `public.is_admin()` security-definer function (avoids RLS recursion)
- Route protection via Next.js middleware (`src/proxy.ts`)
- Admin routes require `role = 'admin'` in the profiles table
- Winner proof uploads restricted to the uploader's own storage path

---

## 🎨 Design System

Dark-mode first UI using:
- **Emerald / Teal / Cyan** gradient palette
- **Glassmorphism** cards with `backdrop-blur`
- **Framer Motion** animations throughout
- **Inter** font via Google Fonts
- Custom CSS tokens in `globals.css`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| UI Primitives | Radix UI |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Storage | Supabase Storage |

---

## 🔧 Admin Setup

1. Sign up with a regular account
2. Run in Supabase SQL Editor:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
   ```
3. Access admin dashboard at `/admin`

---

*Built by Digital Heroes as part of the full-stack developer evaluation.*
