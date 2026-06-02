import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";
const migrationUrl = directUrl || databaseUrl;

if (!migrationUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL is required for Prisma migrations.");
}

if (!directUrl && (databaseUrl.includes("pgbouncer=true") || databaseUrl.includes(":6543"))) {
  throw new Error("DIRECT_URL is required for Prisma migrations when DATABASE_URL uses the Supabase pooler.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations run against the direct connection (port 5432) so Prisma's
    // advisory lock works. The pooled DATABASE_URL (pgBouncer, 6543) would hang.
    url: migrationUrl,
  },
});
