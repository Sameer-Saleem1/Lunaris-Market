# Lunaris Market

Production-ready e-commerce application built with Next.js App Router, Prisma, and PostgreSQL. It includes authentication with email verification, a product catalog with search and filtering, cart and checkout UI, and admin APIs for product and category management.

## Features

- Customer authentication with email verification and JWT sessions
- Product catalog with search and category filters
- Cart, checkout, and order history pages
- Admin APIs for category and product management
- Server-side data access with Prisma and PostgreSQL

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS
- Zod validation, JWT auth, Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- PostgreSQL database (local or hosted)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
JWT_SECRET="your-secure-secret"

# Email verification (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM_NAME="E-Commerce App"

# Public app URL (used in verification links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Stripe payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Database Setup

Apply migrations to create the database tables:

```bash
npx prisma migrate deploy
```

### Run the App

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Generate Prisma client and build the app
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Deployment

Build the app with `npm run build` and run it with `npm run start`. Configure environment variables in your hosting provider before deploying.
