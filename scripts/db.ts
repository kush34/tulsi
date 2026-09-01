import { execSync } from "child_process";

const command = process.argv[2];

try {
  switch (command) {
    case "migrate":
      console.log("Running migrations...");
      execSync("npx prisma migrate dev", { stdio: "inherit" });
      break;
    case "deploy":
      console.log("Deploying migrations...");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      break;
    case "seed":
      console.log("Seeding database...");
      execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
      break;
    case "reset":
      console.log("Resetting database...");
      execSync("npx prisma migrate reset", { stdio: "inherit" });
      break;
    case "generate":
      console.log("Generating Prisma client...");
      execSync("npx prisma generate", { stdio: "inherit" });
      break;
    case "studio":
      console.log("Opening Prisma Studio...");
      execSync("npx prisma studio", { stdio: "inherit" });
      break;
    default:
      console.log("Usage: tsx scripts/db.ts [migrate|deploy|seed|reset|generate|studio]");
      process.exit(1);
  }
} catch (error) {
  console.error("Database command failed:", error);
  process.exit(1);
}
