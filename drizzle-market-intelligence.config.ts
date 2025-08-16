import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema-market-intelligence.ts",
  out: "./drizzle/market-intelligence",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://sharpsend:sharpsend123@localhost:5432/sharpsend",
  },
  verbose: true,
  strict: true,
});

