# 🇬🇭 SkillsConnect Ghana

**SkillsConnect Ghana** is a full-stack web application designed to connect verified Ghanaian artisans (electricians, plumbers, carpenters, masons, mechanics, tailors, beauticians, and more) with customers across all 16 regions of Ghana.

The platform provides an artisan directory, direct enquiries, Paystack Mobile Money and Card checkout, customer reviews, and a management control panel.

---

## ✨ Features

### 👥 For Customers
- **Artisan Directory**: Search artisans by trade category, region, district, rating, and keywords.
- **Trade Finder**: Describe the work and location you need, then use the result to narrow the directory.
- **Enquiries & Messaging**: Send job requests and communicate directly with artisans in real-time.
- **Paystack Checkout**: Test service payments with **MTN Mobile Money**, **Telecel Cash**, **AT Money**, or **Bank Cards**.
- **Ratings & Reviews**: Share feedback and rate completed jobs.
- **Payment Receipts**: Access printable receipts and transaction histories anytime.

### 🛠️ For Artisans
- **Profile & Gallery Showcase**: Display trade skills, years of experience, service areas, and work portfolio photos.
- **Enquiry Management**: Receive job requests, update status (Pending, In Progress, Completed), and chat with clients.
- **Earnings & Payout Tracking**: Track received customer payments and transaction records.
- **Verification Badge**: Gain customer trust through admin profile approval.

### 🛡️ For Administrators
- **Management Dashboard**: Monitor platform metrics, user registrations, and overall system activity.
- **Artisan Approval Workflow**: Verify and approve artisan profiles before they go live.
- **User & Category Control**: Manage accounts, trade categories, testimonials, and payment logs.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Styling**: Tailwind CSS, Bootstrap 5, and [Lucide React](https://lucide.dev/) Icons
- **Backend**: Next.js API Routes (Serverless / Server-side)
- **Database**: Dual Mode — MySQL / MariaDB support with zero-config **SQLite** fallback (`sql.js`)
- **Authentication**: Custom JWT Authentication (`jose`, `bcryptjs`) with HTTP-only cookies
- **Payments**: Paystack Gateway API (Ghana Mobile Money & Cards)
- **Optional provider integration**: The trade finder can use a configured text provider, with a local matching fallback for development.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/Jesse123272/skillsconnect-ghana.git
cd skillsconnect-ghana
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory (you can copy `.env.example` as a template):

```bash
cp .env.example .env.local
```

Fill in the required environment variables:

```env
# General
APP_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database (Optional: Defaults to built-in SQLite if host is omitted)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skillsconnect_db

# Paystack Payments
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Email SMTP (SendGrid or Zoho Mail free tier recommended)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key_here
EMAIL_FROM="SkillsConnect Ghana <no-reply@skillsconnectghana.com>"
```

### Testing the payment screen for a project demonstration

Paystack test keys are the correct keys for a defense or local demonstration. They do not move real money, and Paystack may display a test-mode notice during checkout.

1. In the Paystack Dashboard, switch to **Test** mode and copy the test secret key (`sk_test_...`) and public key (`pk_test_...`).
2. Put the secret key only in `PAYSTACK_SECRET_KEY`. Put the public key in both `PAYSTACK_PUBLIC_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`.
3. Start the app with `npm run dev`, sign in as a customer, open an enquiry, and scroll to the **Paystack checkout** card.
4. Enter an amount such as `10.00`. The card will show **Test mode**, which is expected and is useful evidence for Chapter 4.
5. Select **Test payment**. Complete the checkout with the test card or test Mobile Money details supplied in the Paystack Dashboard. Never use a real card or mobile-money PIN.
6. After Paystack redirects to `/payments/verify`, capture the payment form, the Paystack test checkout, and the verification result as separate screenshots.

For a hosted defense deployment, add the same test keys as environment variables in the hosting provider. Also set `NEXT_PUBLIC_SITE_URL` to the exact public HTTPS URL so Paystack can return to the verification page. Replace the test keys with live keys only after the Paystack account and business are fully approved.

### Email SMTP Setup (Free, production-ready)

#### SendGrid

1. Create a free SendGrid account at https://sendgrid.com.
2. Generate an API key under Settings → API Keys.
3. Paste the key into `EMAIL_PASS`.
4. Keep `EMAIL_USER=apikey` and `EMAIL_HOST=smtp.sendgrid.net`.
5. Set `EMAIL_FROM` to a verified sender email or domain.

#### Zoho Mail

1. Create a free Zoho Mail account at https://www.zoho.com/mail/.
2. Verify your sender email or domain.
3. If you use 2FA, generate an app password in Zoho Mail settings.
4. Use these SMTP settings:

```env
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USER=skillsconnectgh@zohomail.com
EMAIL_PASS=your_zoho_app_password_here
EMAIL_FROM="SkillsConnect Ghana <no-reply@skillsconnectghana.com>"
```

SendGrid and Zoho Mail both support free-tier email delivery and are suitable for verification codes, enquiries, and notification emails.

### Test SMTP Delivery

After you start the app, sign in as an admin and use the built-in SMTP diagnostics route to confirm email delivery:

1. Open the admin dashboard.
2. Navigate to the email settings or diagnostics section.
3. Enter a valid recipient email address and submit the test.
4. The app will send a live test message using your configured SMTP credentials.

If SMTP is not fully configured, the app will still log a mock delivery message in the server console.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 5. Deploy to Vercel

This project is ready for deployment to Vercel.

1. Install the Vercel CLI if you don't already have it:

```bash
npm install -g vercel
```

2. Run the deploy command in the project root:

```bash
vercel deploy --prod --confirm
```

3. If this is your first deployment, follow the Vercel prompts to link the project and configure environment variables.

4. Add the same environment variables from `.env.local` into your Vercel project settings.

Once deployed, your app will be available at the generated Vercel URL.

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Builds the application for production deployment |
| `npm start` | Starts the production server |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |

---
## 📦 Upload Storage Path

Uploaded files are stored under the project root in `public/uploads`.
The application writes files to:

```text
[project root]/public/uploads
```

Public URLs are served from `/uploads/<filename>`.

## 📫 Support Contact

If you need assistance, use the current contact details:

- **Email:** skillsconnectgh@zohomail.com
- **Phone:** +233530600127

---
## 📁 Project Structure

```text
skillsconnect-ghana/
├── app/                      # Next.js App Router pages and API routes
│   ├── api/                  # Server API endpoints (auth, artisans, payments, etc.)
│   ├── artisans/             # Public artisan directory
│   ├── dashboard/            # Role-based dashboards (customer, artisan, admin)
│   ├── login/                # User login page
│   ├── payments/             # Paystack payment verification callback
│   ├── register/             # User registration (customer & artisan)
│   ├── globals.css           # Global CSS styles
│   └── page.js               # Landing page / Home
├── components/               # Reusable UI components & layouts
├── context/                  # React Context providers (AuthContext)
├── lib/                      # Helper modules (database, auth, paystack, mailer)
├── public/                   # Static assets & images
├── .env.example              # Environment variables template
├── package.json              # Project dependencies & scripts
└── README.md                 # Project documentation
```

---

## 🔒 Security & Privacy

- All API key secrets (Paystack, Gemini) are kept securely on the server side (`/app/api/*`).
- Authentication uses secure HTTP-only cookies and bcrypt password hashing.

---

## 📄 License

This project is licensed under the MIT License.
