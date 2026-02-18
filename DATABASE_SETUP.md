# Database Setup Instructions

## Issue

You're getting a 500 error because the database tables haven't been created yet.

## Solution

### Option 1: Using Command Prompt (Recommended for Windows)

1. Open **Command Prompt** (not PowerShell)
2. Navigate to your project:
   ```cmd
   cd "E:\Web Development\NEXT JS Projects\e-commerce-app"
   ```
3. Run the migration:
   ```cmd
   npx prisma migrate deploy
   ```

### Option 2: Using PowerShell (requires admin)

1. Open **PowerShell as Administrator**
2. Run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Then navigate to your project and run:
   ```powershell
   npx prisma migrate deploy
   ```

### Option 3: Using Git Bash

1. Open **Git Bash**
2. Navigate to your project:
   ```bash
   cd "/e/Web Development/NEXT JS Projects/e-commerce-app"
   ```
3. Run the migration:
   ```bash
   npx prisma migrate deploy
   ```

## What This Does

- Creates all the necessary tables in your Neon PostgreSQL database:
  - User
  - VerificationToken
  - Product
  - Category
  - Cart
  - CartItem
  - Order
  - OrderItem

## After Running Migration

1. Restart your development server
2. Try registering again at `http://localhost:3000/register`

## Verify It Worked

After running the migration, you should see output like:

```
✔ All migrations have been applied successfully.
```

Then your registration API will work! 🎉
