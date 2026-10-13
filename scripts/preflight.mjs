import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ALLOWED_EMAIL_1",
  "ALLOWED_EMAIL_2",
  "SITE_URL",
];
const missing = required.filter(
  (k) => !process.env[k] || /your-|example\.com/.test(process.env[k]),
);
if (missing.length) {
  console.error("Missing runtime settings:", missing.join(", "));
  process.exit(1);
}
if (
  process.env.ALLOWED_EMAIL_1.toLowerCase() ===
  process.env.ALLOWED_EMAIL_2.toLowerCase()
)
  throw new Error("Configure two distinct allowed emails");
const sql = readFileSync("supabase/relaunch.sql", "utf8");
if (/\b(drop|truncate|delete)\s+(table|schema|from|policy)\b/i.test(sql))
  throw new Error("Relaunch SQL unexpectedly removes objects or rows");
console.log(
  "Runtime configuration and non-removal migration preflight passed. No secrets printed.",
);
