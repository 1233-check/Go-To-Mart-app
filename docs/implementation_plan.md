# Quick Commerce Platform — Implementation Plan

A Blinkit/Zepto-style quick delivery platform for Dimapur, Nagaland (30km radius). Four web apps: Customer, Admin Dashboard, Store, Delivery Partner.

**App Name:** Go To Mart  
**Deadline:** March 4, 2026 (Wednesday)

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | SSR, API routes, route groups — one codebase for 4 apps |
| **Database** | Supabase (PostgreSQL) | Auth, real-time, storage, row-level security — fast setup |
| **Auth** | Supabase Auth | Email/password + phone OTP |
| **Payments** | Razorpay (Phase 2) | Indian market standard |
| **Styling** | CSS + design system | Fast, no dependency bloat |
| **Deployment** | Vercel | Zero-config Next.js deployment |

---

## Architecture — Single Next.js App with Route Groups

```
quickbasket/
├── src/
│   ├── app/
│   │   ├── (customer)/          ← Customer-facing app (/)
│   │   │   ├── page.js          ← Home (categories, search, products)
│   │   │   ├── cart/            ← Cart page
│   │   │   ├── checkout/       ← Checkout + COD/Razorpay
│   │   │   └── orders/         ← Order history & tracking
│   │   ├── (admin)/admin/       ← Admin dashboard (/admin)
│   │   │   ├── page.js          ← Dashboard stats
│   │   │   ├── orders/         ← Order management
│   │   │   └── products/       ← Product CRUD
│   │   ├── (store)/store/       ← Store app (/store)
│   │   ├── (delivery)/delivery/ ← Delivery app (/delivery)
│   │   └── login/              ← Shared login
│   ├── lib/
│   │   ├── supabase.js         ← Supabase client (with mock fallback)
│   │   └── cart.js             ← Cart utilities (localStorage)
│   └── app/globals.css          ← Design system
├── .agents/workflows/           ← Agent workflow skills
├── .env.local                   ← API keys (not committed)
└── supabase-schema.sql          ← Full database schema reference
```

---

## Database Schema (Supabase)

**Tables:** profiles, categories, products, addresses, orders, order_items  
**RLS:** Enabled on all tables with role-based access  
**Realtime:** Enabled on orders table  
**Seed data:** 11 categories, 63 products  

---

## Phase Breakdown

### ✅ Phase 0: Project Setup & Infrastructure
- [x] Next.js 14 project with App Router
- [x] Supabase project connected
- [x] Database schema + RLS + seed data
- [x] Design system (deep indigo branding)

### ✅ Phase 1: Core Backend & Auth
- [x] Supabase auth (email/password)
- [x] Role-based access (customer, admin, store, delivery)
- [x] Real-time subscriptions for order status

### ✅ Phase 2: Customer App
- [x] Home — category grid, search, product cards
- [x] Cart — add/remove/quantity, bill summary
- [x] Checkout — address, COD payment
- [x] Order tracking — 8-step timeline with real-time updates
- [ ] User profile page

### ✅ Phase 3: Admin Dashboard
- [x] Dashboard — stats (orders, revenue, products)
- [x] Orders — filter tabs, status progression, delivery partner assignment
- [x] Products — CRUD, stock, active/hidden toggle
- [ ] User management
- [ ] Analytics & reports

### ✅ Phase 4: Store App
- [x] Tabbed order processing (Active/Ready/Completed)
- [x] One-click status: Confirm → Packing → Packed
- [ ] Inventory management

### ✅ Phase 5: Delivery Partner App
- [x] Active/Completed order tabs
- [x] Google Maps address integration
- [x] COD collection notices
- [x] Earnings tracker

### Phase 6: Payments (Last)
- [ ] Razorpay integration
- [ ] Payment verification API

### Phase 7: Polish & Deploy
- [ ] Vercel deployment
- [ ] Mobile responsive testing
- [ ] PWA install testing
- [ ] End-to-end order flow testing

---

## Verification Plan

### Manual Testing (Browser)
1. **Customer Flow:** Browse → Add to cart → Checkout → Track order
2. **Admin Flow:** Login → Manage orders → Assign delivery partner
3. **Store Flow:** See order → Confirm → Pack → Mark ready
4. **Delivery Flow:** See assigned → Pick up → Deliver
5. **Cross-app:** Place order → process through all 4 apps

### Deployment
- Deploy to Vercel with environment variables
- Test on mobile browsers (Chrome/Safari)
- Test PWA installability
