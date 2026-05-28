import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations run against the direct connection (port 5432) so Prisma's
    // advisory lock works. The pooled DATABASE_URL (pgBouncer, 6543) would hang.
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
  },
});
