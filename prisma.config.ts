import "dotenv/config";
import { defineConfig } from "prisma/config";

// Default DATABASE_URL to a local SQLite file so `npm run dev` works on a
// fresh clone even if the developer hasn't copied .env.example to .env yet.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
