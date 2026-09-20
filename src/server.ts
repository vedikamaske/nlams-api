import http from "node:http";
import chalk from "chalk";
import app from "./app.js";
import { env } from "./config/env.js";
import { testDbConnection, closeDbPool } from "./config/database.js";
import { verifySupabaseConfig } from "./config/supabase.js";

const startServer = async (): Promise<void> => {
  // Test PostgreSQL database connectivity
  const dbConnected = await testDbConnection();
  if (!dbConnected) {
    if (env.NODE_ENV === "production") {
      console.error(
        chalk.red.bold("❌ Server startup aborted due to PostgreSQL database connection failure.")
      );
      process.exit(1);
    } else {
      console.warn(
        chalk.yellow.bold(
          "⚠️ Database connection failed. Starting server in development mode for API health checks."
        )
      );
    }
  }

  // Verify Supabase configuration
  const supabaseConfigured = verifySupabaseConfig();
  if (!supabaseConfigured) {
    console.error(
      chalk.red.bold("❌ Server startup aborted due to missing Supabase configuration.")
    );
    process.exit(1);
  }

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log("");
    console.log(chalk.cyan.bold("════════════════════════════════════════"));
    console.log(chalk.cyan.bold(" NLAMS API — Foundation Server"));
    console.log(chalk.cyan.bold("════════════════════════════════════════"));
    console.log(`${chalk.gray(" Environment :")} ${chalk.yellow.bold(env.NODE_ENV)}`);
    console.log(`${chalk.gray(" Port        :")} ${chalk.green.bold(env.PORT)}`);
    console.log(`${chalk.gray(" Database    :")} ${chalk.green.bold("Connected")}`);
    console.log(`${chalk.gray(" Supabase    :")} ${chalk.green.bold("Configured")}`);
    console.log(chalk.cyan.bold("════════════════════════════════════════"));
    console.log("");
  });

  // Graceful Shutdown Logic
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("");
    console.log(chalk.yellow.bold(`⚠️ Received ${signal}. Starting graceful shutdown...`));

    // 1. Stop HTTP server from receiving new requests
    server.close(async (err) => {
      if (err) {
        console.error(chalk.red("❌ Error closing HTTP server:"), err.message);
      } else {
        console.log(chalk.green("✔ HTTP server stopped accepting connections."));
      }

      // 2. Close Database Pool
      await closeDbPool();

      console.log(chalk.cyan.bold("✔ NLAMS API server shutdown complete. Exiting."));
      console.log("");
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long (timeout 10s)
    setTimeout(() => {
      console.error(chalk.red.bold("❌ Shutdown timeout reached. Forcing exit."));
      process.exit(1);
    }, 10000).unref();
  };

  // Register signal listeners
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer().catch((err) => {
  console.error(chalk.red.bold("❌ Unhandled server startup error:"), err);
  process.exit(1);
});
