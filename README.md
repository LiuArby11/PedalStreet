# PedalStreet

PedalStreet is a Supabase-backed e-commerce app for cycling products with:
- user authentication
- product catalog and variants
- cart and checkout
- order tracking
- admin inventory and dispatch controls
- admin audit trail

## Quick Defense Summary (1 Minute)

Use this as your opening statement:

"PedalStreet is a web-based e-commerce system for cycling products built with React, Tailwind, and Supabase. It supports customer and admin roles, secure authentication, product and variant management, cart/checkout flow, order status updates, and admin audit logs. We implemented soft-delete for products, duplicate product prevention, payment status confirmation on admin side, and structured delivery address support. The project focuses on functionality, access control, and data integrity as required by the semester project scope."

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

## Panelist Checklist Mapping

Recommendations / Heads-Up coverage:

1. Delete behavior (soft delete): Implemented.
2. Avoid duplicates: Implemented (UI guard + DB unique index for active product names).
3. Documentation wording: Implemented (no exaggerated claims about payment gateway).
4. Payment flow: Implemented (admin payment status confirmation).
5. Backup plan: Implemented in this README.
6. Authentication & security: Implemented and documented.
7. Delivery address UX: Implemented (structured fields + saved contacts).

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

## Common Panel Questions (Ready Answers)

### Why Supabase?
"We used Supabase because it provides PostgreSQL database, authentication, and access control in one platform. It let us implement Admin/Customer flows quickly while keeping data relational, secure, and maintainable."

### Is password stored as plain text?
"No. Passwords are handled by Supabase Auth and stored as hashed and salted values, not plain text."

### How is authentication and access secured?
"We use Supabase Auth for login sessions, route-level access checks in frontend, and role-based/RLS policies in database so users only access allowed data."

### Why no payment gateway?
"The project scope does not require gateway integration. We implemented operational payment status (`PENDING`, `CONFIRMED`, `PAID`) in admin to make the workflow realistic."

### What happens when product is deleted?
"Product is not hard-deleted. It is archived (`is_archived`), can be restored, and remains recoverable for audit/history safety."

### How do you prevent duplicate products?
"We block duplicate active product names in admin create/update and enforce uniqueness in DB for active products."

### What is your backup/recovery plan?
"Daily snapshots, periodic SQL exports, offsite backup storage, and tested recovery flow (restore, validate data, verify critical flows, then switch environment)."

## Live Demo Flow (Safe Sequence)

1. Login as Admin.
2. Show product list and archive one product (soft delete).
3. Switch product filter to `ARCHIVED`, then restore it.
4. Try creating duplicate product name -> show validation block.
5. Go to Orders -> show logistics status and payment status actions.
6. Mark payment status (`PENDING` -> `CONFIRMED` -> `PAID`).
7. Logout Admin, login as Customer.
8. Show checkout saved contact + structured address fields.
9. Place order and show customer order page with payment status.

## Notes Before Defense Day

1. Ensure all SQL files above are already executed on the same Supabase project used in demo.
2. Confirm one admin account and one customer account are ready.
3. Prepare stable sample data:
   - active and archived products
   - at least one order in each major status
   - one low-stock product
4. Keep this README open as your quick memory guide during rehearsal.
