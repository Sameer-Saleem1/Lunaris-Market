import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  console.log("📂 Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Electronics" },
    }),
    prisma.category.create({
      data: { name: "Laptop" },
    }),
    prisma.category.create({
      data: { name: "Audio" },
    }),
    prisma.category.create({
      data: { name: "Accessories" },
    }),
    prisma.category.create({
      data: { name: "Home & Office" },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create products
  console.log("📦 Creating products...");
  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: "HP Elitebook 1030 G7",
        description:
          "13.3-inch premium business laptop with Intel Core i7 processor, 16GB RAM, and 512GB SSD. Features touchscreen display and long battery life.",
        price: 1299.99,
        stock: 15,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0909/7425/7459/files/61hun8AycgL._AC_SL1500__1.jpg?v=1733496352",
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Dell Latitude 7420",
        description:
          "14-inch business laptop with 11th Gen Intel Core i5, 8GB RAM, 256GB SSD. Lightweight design perfect for professionals.",
        price: 899.99,
        stock: 22,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0909/7425/7459/files/dell-latitude-7420.jpg?v=1733496352",
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "HP Elitebook 2560",
        description:
          "Compact 12.5-inch laptop with Intel Core i5, 8GB RAM, 256GB SSD. Ideal for travel and remote work.",
        price: 599.99,
        stock: 8,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0909/7425/7459/files/hp-elitebook-2560.jpg?v=1733496352",
        categoryId: categories[1].id,
      },
    }),

    // Audio
    prisma.product.create({
      data: {
        name: "Sony WH-1000XM5",
        description:
          "Industry-leading noise canceling wireless headphones with up to 30-hour battery life. Premium sound quality and comfort.",
        price: 399.99,
        stock: 35,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0909/7425/7459/files/sony-wh1000xm5.jpg?v=1733496352",
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Bose QuietComfort 45",
        description:
          "Wireless noise cancelling headphones with exceptional audio performance and comfortable over-ear design.",
        price: 329.99,
        stock: 28,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/bose-qc45.jpg",
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Apple AirPods Pro (2nd Gen)",
        description:
          "Active noise cancellation, adaptive transparency, personalized spatial audio. Up to 6 hours of listening time.",
        price: 249.99,
        stock: 50,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/airpods-pro-2.jpg",
        categoryId: categories[2].id,
      },
    }),

    // Accessories
    prisma.product.create({
      data: {
        name: "Logitech MX Master 3S",
        description:
          "Advanced wireless mouse with ultra-precise scrolling, customizable buttons, and ergonomic design.",
        price: 99.99,
        stock: 42,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/logitech-mx-master-3s.jpg",
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Keychron K8 Pro",
        description:
          "Wireless mechanical keyboard with hot-swappable switches, RGB backlight, and Mac/Windows compatibility.",
        price: 109.99,
        stock: 31,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/keychron-k8-pro.jpg",
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Anker PowerCore 20000",
        description:
          "High-capacity portable charger with dual USB ports. Charge your devices multiple times on a single charge.",
        price: 49.99,
        stock: 67,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/anker-powercore.jpg",
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "USB-C Hub 7-in-1",
        description:
          "Multiport adapter with HDMI, USB 3.0, SD card reader, and USB-C power delivery. Perfect for MacBook and laptops.",
        price: 39.99,
        stock: 55,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/usbc-hub.jpg",
        categoryId: categories[3].id,
      },
    }),

    // Home & Office
    prisma.product.create({
      data: {
        name: "Herman Miller Aeron Chair",
        description:
          "Ergonomic office chair with adjustable lumbar support, breathable mesh, and premium build quality.",
        price: 1395.0,
        stock: 12,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/herman-miller-aeron.jpg",
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Standing Desk Pro",
        description:
          "Electric height-adjustable desk with memory presets. Smooth and quiet motor, solid wood top.",
        price: 699.99,
        stock: 18,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/standing-desk.jpg",
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Monitor Arm Dual Mount",
        description:
          "Heavy-duty dual monitor mount with full articulation. Supports monitors up to 32 inches.",
        price: 129.99,
        stock: 24,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/monitor-arm.jpg",
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Desk Mat XL",
        description:
          "Premium leather desk mat, double-sided design. Water-resistant and easy to clean.",
        price: 59.99,
        stock: 38,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/desk-mat.jpg",
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "LED Desk Lamp",
        description:
          "Adjustable brightness and color temperature. USB charging port and touch controls.",
        price: 79.99,
        stock: 29,
        imageUrl:
          "https://cdn.shopify.com/s/files/1/0057/8938/4802/files/desk-lamp.jpg",
        categoryId: categories[4].id,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
