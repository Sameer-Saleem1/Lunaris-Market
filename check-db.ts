import { prisma } from "./app/lib/prisma";

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...");

    // Try to connect
    await prisma.$connect();
    console.log("✅ Database connected successfully!");

    // Check if User table exists
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists. Found ${userCount} users.`);

    await prisma.$disconnect();
    console.log("✅ All checks passed!");
  } catch (error) {
    console.error("❌ Database error:", error);
    console.log("\n💡 Run this command to set up your database:");
    console.log("   npx prisma migrate deploy");
    process.exit(1);
  }
}

checkDatabase();
