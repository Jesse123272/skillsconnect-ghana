# Deploying SkillsConnect Ghana with Railway MySQL and Vercel

This application uses MySQL/MariaDB in production. SQLite is only for local development and will not be used in production.

## Google sign-in

Google sign-in is optional. Add these variables to the local environment and Vercel Production environment:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_URL=https://skillsconnect-ghana.vercel.app
```

In Google Cloud Console, add this authorized redirect URI to the OAuth web client:

`https://skillsconnect-ghana.vercel.app/api/auth/google/callback`

For local testing, also add `http://localhost:3000/api/auth/google/callback` and use `APP_URL=http://localhost:3000` locally.

## 1. Prepare the Railway database

1. In Railway, create a **MySQL** service (not PostgreSQL) and wait for it to become healthy.
2. Import the database schema once. `database/skillsconnect.sql` begins by dropping tables, so only run it against a new database or after taking a backup.
3. In the Railway MySQL service, open **Variables** and note the generated `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` values. If Vercel is hosting the app, use Railway's public TCP-proxy host and port rather than an internal `*.railway.internal` host.

## 2. Configure Vercel

Import the repository into Vercel and set the **Root Directory** to `skillsconnect-ghana`. Add the following production environment variables in Vercel (and Preview if desired):

```text
DB_HOST=<Railway public MySQL host>
DB_PORT=<Railway public MySQL port>
DB_USER=<Railway MySQL user>
DB_PASSWORD=<Railway MySQL password>
DB_NAME=<Railway MySQL database>
JWT_SECRET=<a long random secret>
APP_URL=https://<your-vercel-domain>
NEXTAUTH_URL=https://<your-vercel-domain>
NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>
```

Alternatively, add Railway's `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` variables with exactly those names. The application now supports both variable formats. Do not set `USE_SQLITE=true`.

Add the existing Paystack, SMTP, and optional AI variables from `.env.example` as appropriate. Never commit a `.env.local` file or database credentials.

## 3. Verify

After deployment, test registration, login, and a list-artisans page. You can also run this from an environment that has the Railway variables:

```bash
node scripts/check_db.js
```

It checks that the app can reach MySQL and reports the table and user counts without printing credentials.

## 4. Paystack production readiness

The application supports standard Paystack GHS payments and verifies them server-side. Configure these production variables:

```text
PAYSTACK_SECRET_KEY=<Paystack live secret key>
PAYSTACK_PUBLIC_KEY=<Paystack live public key>
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<same live public key>
NEXT_PUBLIC_SITE_URL=https://<your-domain>
```

Set the Paystack webhook URL to:

`https://<your-domain>/api/payments/webhook`

Paystack must send the `x-paystack-signature` header. The webhook rejects unsigned requests and processes each transaction only once.

The current application does not claim escrow. To activate marketplace split payments, complete Paystack business/KYC verification, enable Subaccounts or Split Payments in the Paystack dashboard, create and verify artisan recipient accounts, and provide the approved settlement rules. Those account-owner actions cannot be completed from application code.

## Important: uploads

Vercel's filesystem is ephemeral. The current `public/uploads` storage works locally but uploaded photos will not persist after a Vercel deployment. Use a persistent object-storage provider (such as Cloudinary, S3, or Cloudflare R2) before relying on uploads in production.
