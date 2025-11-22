// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // optional, but nice to be explicit:
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // 🔴 THIS is the important part:
  datasource: {
    // Prisma will use this for the `db` datasource in schema.prisma
    url: env("DATABASE_URL"),
  },
});
