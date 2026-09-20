import { PrismaClient } from "@prisma/client";
import pg from "pg";
import chalk from "chalk";
import { env } from "./env.js";

const { Pool } = pg;

// Prevent multiple instances of Prisma Client in development during hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Reusable Singleton Prisma Client Instance for NLAMS Application Database Operations.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Reusable PostgreSQL Connection Pool for PostGIS / Raw SQL operations.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error(chalk.red.bold("❌ Unexpected PostgreSQL Pool Error:"), err.message);
});

/**
 * Test database connectivity during server startup via Prisma.
 */
export const testDbConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    return true;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red.bold(`❌ PostgreSQL Connection Failed: ${errMessage}`));
    return false;
  }
};

/**
 * Close Prisma Client and PostgreSQL connection pool gracefully.
 */
export const closeDbPool = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log(chalk.yellow("🔌 Database connection clients closed cleanly."));
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`❌ Error closing database connections: ${errMessage}`));
  }
};
