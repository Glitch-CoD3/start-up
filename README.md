# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Supabase image storage

The admin image uploaders use the public `e-commerce` bucket, with product files stored under `product-images/` and website feature files under `feature-images/`. Supabase Storage creates these virtual folders when the first image is uploaded. The newest feature image appears in the storefront homepage hero.

Run [`supabase_storage.sql`](./supabase_storage.sql) once in the Supabase SQL Editor. Images are publicly readable; upload, update, and delete permissions are limited to accounts assigned the `admin` role in `public.users` and `public.user_roles`.

Uploads accept JPG, PNG, WebP, AVIF, and GIF files up to 10 MB. The app supports both `VITE_SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` environment variable names.

## Checkout

Run [`supabase_checkout.sql`](./supabase_checkout.sql) once in the Supabase SQL Editor after the base schema, then apply [`supabase_store_pricing.sql`](./supabase_store_pricing.sql) if using pricing and delivery settings. Checkout records bKash/Nagad/Rocket sender numbers or only the last four card digits, plus the payment transaction reference, for manual verification. It never collects full card numbers, expiry dates, or security codes. The provided mobile-wallet destination is `01858233865`.

## Admin dashboard performance

Run [`supabase_admin_dashboard.sql`](./supabase_admin_dashboard.sql) in the Supabase SQL Editor. It adds an admin-only summary function so dashboard counts and revenue are calculated in the database instead of downloading the full orders table. Admin RPC authorization follows the app's admin-role check; it does not require `users.status = 'active'`.

## Product discounts and delivery charges

Run [`supabase_store_pricing.sql`](./supabase_store_pricing.sql) in the Supabase SQL Editor after the base schema and checkout migration. It adds DB-calculated fixed-amount or percentage product discounts, Dhaka/outside-Dhaka delivery settings (defaults ৳60/৳120), the admin settings RPC, catalog prices, checkout quote/order calculations, a saved homepage feature-image selection, and database-backed homepage text and branding. Until it is run, the storefront loads products at their base prices and uses built-in homepage text; discount editing, checkout pricing, selecting the homepage image, and editing homepage text require the migration. Edit homepage text, browser tab title, and logo name under **Admin → Layout**; edit discounts and delivery fees under **Admin → Store settings**; choose the homepage hero under **Admin → Feature images**. Saved homepage content is served directly from Supabase, so copy and branding changes do not need a frontend redeployment.

The Admin store-settings page also retains the catalog cache TTL database setting for future use. Redis catalog caching is currently disabled; this setting has no effect on product fetching.

## Brand categories

Run [`supabase_brand_categories.sql`](./supabase_brand_categories.sql) after the base schema. It assigns each brand to one category and filters the product editor's brand choices to the selected category. Existing brands tied consistently to products are assigned automatically; brands spanning multiple categories remain unassigned until corrected under **Admin → Brands**.
