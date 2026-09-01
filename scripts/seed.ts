import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.user.upsert({
    where: { email: "admin@tulsi.dev" },
    update: {},
    create: {
      email: "admin@tulsi.dev",
      name: "Admin",
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
