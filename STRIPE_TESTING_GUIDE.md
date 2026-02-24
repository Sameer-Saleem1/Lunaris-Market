# Stripe Payment Gateway Testing Guide

## 🔧 Prerequisites

### 1. Get Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Copy your test keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
STRIPE_SECRET_KEY="sk_test_51..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional - for webhook testing (see webhook section below)
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

> **Note**: `STRIPE_WEBHOOK_SECRET` is optional for local testing. The app will automatically complete payments after you return from Stripe.

### 3. Run Database Migration

```bash
# PowerShell (if execution policy issues, use cmd or bash terminal)
node_modules\.bin\prisma.cmd migrate dev --name add_order_payment_fields

# Or in bash/cmd
npx prisma migrate dev --name add_order_payment_fields
```

---

## 🧪 Test Card Numbers

### ✅ Successful Payments

| Card Number           | Scenario               |
| --------------------- | ---------------------- |
| `4242 4242 4242 4242` | Visa - Always succeeds |
| `5555 5555 5555 4444` | Mastercard - Succeeds  |
| `3782 822463 10005`   | American Express       |

**For all cards:**

- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### ❌ Failed Payments

| Card Number           | Scenario           |
| --------------------- | ------------------ |
| `4000 0000 0000 0002` | Card declined      |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card       |

### ⏳ Special Scenarios

| Card Number           | Scenario                 |
| --------------------- | ------------------------ |
| `4000 0025 0000 3155` | 3D Secure authentication |
| `4000 0000 0000 3220` | 3D Secure 2 required     |

[Full list of test cards](https://stripe.com/docs/testing#cards)

---

## 🚀 Testing Flow

### Step 1: Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 2: Create Test Account

1. Go to **Register** page
2. Create a test account:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test123!`

### Step 3: Add Products to Cart

1. Login with your test account
2. Go to **Dashboard/Catalog**
3. Add items to cart
4. Navigate to **Cart** page

### Step 4: Checkout Flow

1. Click **Checkout** button
2. Review order details
3. Apply coupon code `LUNARIS10` (optional - 10% discount)
4. Click **Pay with Stripe**
5. You'll be redirected to Stripe Checkout

### Step 5: Complete Payment

On Stripe Checkout page:

1. **Email**: Auto-filled or enter test email
2. **Card Number**: `4242 4242 4242 4242`
3. **Expiry**: `12/34`
4. **CVC**: `123`
5. **ZIP**: `12345`
6. Click **Pay**

### Step 6: Verify Success

1. After payment, you'll return to `/return` page
2. **Automatic completion**: The app will auto-detect the successful payment and finalize your order (without needing webhooks)
3. Wait 2-5 seconds for "Payment confirmed" message
4. Click **View order** to see order details
5. Check order status shows `PAID`

> **How it works**: The return page calls Stripe's API to verify payment, then automatically completes the order by decrementing stock and clearing your cart. This works in both local development and production without requiring webhook setup.

---

## 🔄 Webhooks Setup (Optional)

> **Important**: Webhooks are **completely optional** for both development and production. The app automatically completes payments when users return from Stripe, even in production. Only set up webhooks if you need backup payment processing or want to handle edge cases where users don't return to your site.

### When Do You Need Webhooks?

✅ **You DON'T need webhooks if:**
- Users complete payment and return to your site (default flow)
- Testing locally or in production with test mode
- You're okay with manual order completion for abandoned sessions

❌ **You NEED webhooks only if:**
- Users close the browser before returning to your site
- You want backup payment processing
- You need to handle asynchronous payment methods (bank transfers, etc.)

---

## 🔄 Local Testing (Optional Webhook Setup)

### Option 1: Stripe CLI (Production Testing)

#### Install Stripe CLI

**Windows (PowerShell as Administrator):**

```powershell
# Download and install from Stripe CLI releases
# Or use Chocolatey:
choco install stripe-cli
```

**Mac (Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

#### Setup Webhooks

1. **Login to Stripe CLI:**

```bash
stripe login
```

2. **Forward webhooks to local server:**

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

3. **Copy webhook signing secret** from output (starts with `whsec_`)
4. **Add to `.env`:**

```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

5. **Restart dev server** to load new env variable

6. **Test webhook:**

```bash
stripe trigger checkout.session.completed
```

### Option 2: Skip Webhooks (Recommended for Local Testing)

The app is designed to work without webhooks for local development:

1. **Just use Stripe test cards** - no webhook setup needed
2. **Complete payment** on Stripe Checkout page
3. **Return to app** - payment will auto-complete within 3-5 seconds
4. **Order status** updates to `PAID` automatically

The return page uses Stripe's API to verify payment and complete the order, bypassing the need for webhook forwarding.

---

## 🧪 Test Scenarios

### ✅ Successful Payment

1. Add items to cart
2. Checkout with `4242 4242 4242 4242`
3. Verify order status = `PAID`
4. Verify cart is cleared
5. Verify product stock is decremented

### ❌ Failed Payment

1. Add items to cart
2. Checkout with `4000 0000 0000 0002`
3. Payment should fail on Stripe side
4. Order status should be `FAILED`
5. Cart items should remain

### 🎫 Coupon Code

1. Add items to cart (total > $0)
2. Apply coupon `LUNARIS10` in checkout
3. Verify 10% discount applied
4. Complete payment
5. Verify discount saved in order

### ❌ Cancel Payment

1. Start checkout process
2. On Stripe page, click browser back button
3. Should redirect to `/checkout?canceled=1`
4. See cancellation message
5. Cart should still have items

### 📦 Stock Validation

1. Find a product with low stock (e.g., 2 items)
2. Add 3+ items to cart
3. Try to checkout
4. Should get "Not enough stock" error

---

## 🔍 Monitoring & Debug

### Check Order Status

**Prisma Studio:**

```bash
npx prisma studio
```

- Open `Order` model
- Check `status` and `paymentStatus` fields
- Verify `stripeSessionId` is populated

### View Stripe Dashboard

1. Go to [Stripe Dashboard > Payments](https://dashboard.stripe.com/test/payments)
2. See all test payments
3. Click payment to see details
4. Check metadata for `orderId` and `userId`

### Server Logs

Check terminal for:

- `"Checkout session completed:"` - webhook received
- `"Stripe fulfillment error:"` - webhook processing failed
- `"Checkout error:"` - checkout API error

### Common Issues

| Issue                             | Solution                                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| Order stuck in `PENDING`/`UNPAID` | Wait 3-5 seconds on return page - auto-completes without webhooks    |
| "Missing Stripe redirect URL"     | Check Stripe keys are in `.env` and restart dev server               |
| "Unable to start checkout"        | Check server logs for Stripe API errors, verify keys are valid       |
| TypeScript errors                 | Run `node_modules\.bin\prisma.cmd generate`                          |
| Payment shows UNPAID immediately  | Normal - give it 3-5 seconds on `/return` page to auto-complete      |
| Auto-completion not working       | Check browser console for errors, verify `STRIPE_SECRET_KEY` is set  |
| Database migration errors         | Delete `migrations` folder and run `prisma migrate dev` from scratch |

---

## 📊 Test Checklist

- [ ] Stripe test keys configured in `.env`
- [ ] Database migration applied
- [ ] Dev server running
- [ ] Test user registered
- [ ] Products in cart
- [ ] Successful payment with `4242 4242 4242 4242`
- [ ] Order status = `PAID`
- [ ] Cart cleared after payment
- [ ] Stock decremented
- [ ] Coupon code `LUNARIS10` works
- [ ] Payment cancellation works
- [ ] Failed payment with `4000 0000 0000 0002`
- [ ] Webhook firing (if Stripe CLI setup)

---

## 🎯 Next Steps - Production

Before going live:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Update `.env`** with live keys (`pk_live_...`, `sk_live_...`)
3. **Configure production webhook** endpoint in Stripe
4. **Test with real card** (small amount)
5. **Enable dispute protection** in Stripe
6. **Set up customer emails** for receipts
7. **Configure tax rates** (if applicable)
8. **Review Stripe compliance** checklist

---

## 📚 Resources

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)
