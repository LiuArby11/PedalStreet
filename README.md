# PedalStreet

PedalStreet is a Supabase-backed e-commerce app for cycling products with:
- user authentication
- product catalog and variants
- cart and checkout
- order tracking
- admin inventory and dispatch controls
- admin audit trail

## Setup

1. Install dependencies:
```bash
npm install
```
2. Configure `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
3. Run the app:
```bash
npm run dev
```

## Required SQL Migrations

Run these in Supabase SQL Editor:
- `sql/products_soft_delete.sql`
- `sql/checkout_stock_rpc.sql`
- `sql/admin_categories_and_users.sql`
- `sql/admin_audit_logs.sql`
- `sql/profile_email_sync.sql`
- `sql/profile_address_and_delivery_instructions.sql`
- `sql/orders_payment_and_product_uniqueness.sql`
- `sql/profile_signup_conflict_fix.sql`

## Implemented Behaviors (Defense Notes)

- Product removal is soft-delete (`is_archived`) and can be restored from Admin.
- Duplicate active product names are blocked in UI and can be enforced in DB via `products_active_name_unique_idx`.
- Checkout stores `payment_method`, optional `payment_details`, and starts `payment_status` as `PENDING`.
- Admin can update `payment_status` (`PENDING`, `CONFIRMED`, `PAID`) for operational confirmation.
- Checkout supports saved contacts and optional structured address entry for smoother delivery details.

## Security Model

- Authentication uses Supabase Auth.
- Admin page is route-protected in the frontend.
- RLS policies are defined for admin audit logs, categories, and profile visibility.
- Admin-only operations are guarded by `profiles.is_admin` checks in SQL policies/functions.
- Profile emails are synchronized into `profiles.email_copy` with a unique lower-case index.

## Backup and Recovery Plan

Operational recommendation for Supabase Postgres:

1. Schedule regular backups using Supabase Backups (daily snapshots).
2. Keep periodic SQL exports for key tables (`products`, `orders`, `order_items`, `profiles`, `vouchers`).
3. Store backups in a separate secure location.
4. Recovery flow:
   - restore latest snapshot to a recovery project/database
   - verify table integrity and row counts
   - validate critical flows (login, checkout, admin updates)
   - switch environment variables to recovered database if needed

This project also keeps admin audit logs to support operational rollback discussions during defense.
