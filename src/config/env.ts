import dotenv from "dotenv";
import { z } from "zod";
import chalk from "chalk";

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5000"),
  SUPABASE_URL: z.string().url().default("https://dummy-project.supabase.co"),
  SUPABASE_PUBLISHABLE_KEY: z.string().default(process.env.SUPABASE_ANON_KEY || "dummy_anon_key"),
  SUPABASE_ANON_KEY: z.string().default(process.env.SUPABASE_PUBLISHABLE_KEY || "dummy_anon_key"),
  SUPABASE_SECRET_KEY: z
    .string()
    .default(process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_service_role_key"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .default(process.env.SUPABASE_SECRET_KEY || "dummy_service_role_key"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/nlams_dev"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(chalk.red.bold("❌ Invalid Environment Variable Configuration:"));
    result.error.issues.forEach((issue) => {
      console.error(chalk.red(`   - ${issue.path.join(".")}: ${issue.message}`));
    });
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type EnvironmentConfig = typeof env;
