---
description: How to create a new page/route in Go To Mart
---

# Creating a New Page

## Steps

1. **Identify the app group** — Which app does the page belong to?
   - Customer: `src/app/(customer)/`
   - Admin: `src/app/(admin)/admin/`
   - Store: `src/app/(store)/store/`
   - Delivery: `src/app/(delivery)/delivery/`

2. **Create the route folder** — Create a new directory for the route:
   ```
   src/app/(customer)/[route-name]/page.js
   ```

3. **Use the standard template**:
   ```javascript
   'use client';
   
   import { useState, useEffect } from 'react';
   import Link from 'next/link';
   import { supabase } from '@/lib/supabase';
   import { formatPrice } from '@/lib/cart';
   
   export default function PageName() {
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       loadData();
     }, []);
     
     async function loadData() {
       // Fetch from Supabase
       setLoading(false);
     }
     
     return (
       <div style={{ minHeight: '100vh' }}>
         {/* Header */}
         <div className="app-header">
           <Link href="/" style={{ color: 'white', fontSize: '1.25rem' }}>←</Link>
           <h1>Page Title</h1>
           <div />
         </div>
         
         <div style={{ padding: 'var(--space-4)' }}>
           {loading ? (
             <div className="text-center" style={{ padding: 'var(--space-12)' }}>
               <div className="spinner" style={{ margin: '0 auto' }} />
             </div>
           ) : (
             <div>
               {/* Page content */}
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

4. **Style with design system** — Use CSS classes from `globals.css`:
   - Layout: `flex`, `flex-col`, `gap-*`, `items-center`, `justify-between`
   - Text: `text-sm`, `text-secondary`, `font-medium`
   - Components: `btn`, `btn-primary`, `card`, `badge`, `input`, `table`
   - Spacing: `var(--space-1)` through `var(--space-12)`

5. **Test** — Run `npm run dev` and visit `http://localhost:3000/[route-name]`

## Important Notes
- All customer pages should include bottom nav
- Admin pages need the sidebar navigation with `NAV_ITEMS` array
- Always add `'use client'` for interactive pages
- Use `supabase` client for all data operations
- Use `formatPrice()` for displaying prices in ₹
