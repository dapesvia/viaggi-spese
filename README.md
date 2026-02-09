# TravelMate - Travel Management PWA

A mobile-first Progressive Web App for couples to manage trips, expenses, and itineraries together.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting:** Cloudflare Pages

## Features

- 📱 Native-like mobile experience (iOS & Android)
- 💰 Expense tracking with split calculations
- 🗺️ Trip itinerary management
- 📄 Document storage (tickets, receipts)
- 🌙 Dark mode support
- 🔐 Secure authentication with RLS
- 💾 Offline-capable PWA

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the Supabase migration:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the content from `supabase/migrations/001_initial_schema.sql`
   - Execute the migration

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
travelmate/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with bottom nav
│   ├── page.tsx           # Home page (trips list)
│   ├── wallet/            # Wallet page
│   ├── itinerary/         # Itinerary page
│   └── docs/              # Documents page
├── components/            # React components
│   ├── bottom-nav.tsx     # Bottom navigation bar
│   ├── add-expense-drawer.tsx  # Expense input drawer
│   ├── wallet-dashboard.tsx    # Wallet overview
│   └── trip-card.tsx      # Trip card component
├── lib/                   # Utilities
│   ├── utils.ts           # Helper functions
│   └── supabase.ts        # Supabase client & types
├── supabase/
│   └── migrations/        # Database migrations
└── public/
    └── manifest.json      # PWA manifest
```

## Database Schema

- **profiles:** User profiles linked to auth
- **trips:** Trip information and metadata
- **trip_participants:** Links users to trips
- **expenses:** Expense tracking with split logic
- **itinerary_items:** Travel schedule items

All tables have Row Level Security (RLS) enabled for data privacy.

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `.next`
4. Add environment variables in Cloudflare dashboard
5. Deploy!

## iOS Installation

1. Open Safari and navigate to your app
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. The app will appear on your home screen like a native app

## Android Installation

1. Open Chrome and navigate to your app
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. The app will appear on your home screen

## License

MIT
