import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required but not set");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`,
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
