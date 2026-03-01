---
description: How to deploy and manage the Go To Mart project
---

# Deploy Workflow

## Local Development
// turbo-all

1. Install dependencies:
```
npm install
```

2. Start dev server:
```
npm run dev
```

3. Access apps:
   - Customer: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Store: http://localhost:3000/store
   - Delivery: http://localhost:3000/delivery
   - Login: http://localhost:3000/login

## Git Workflow

1. Check status:
```
git status
```

2. Stage and commit:
```
git add .
git commit -m "description of changes"
```

3. Push:
```
git push origin main
```

## Switching Computers

1. Clone the repo on new machine:
```
git clone https://github.com/USERNAME/go-to-mart.git
cd go-to-mart
npm install
```

2. Create `.env.local` with credentials (never committed):
```
NEXT_PUBLIC_SUPABASE_URL=https://ahitvfafdnvmkkfvghbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

3. Start development:
```
npm run dev
```

## Vercel Deployment (Production)

1. Push code to GitHub
2. Connect repo on vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

## Key Environment Variables
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key (Phase 2) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (Phase 2) |
