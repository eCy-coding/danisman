/**
 * Env Bootstrap — must be the FIRST import in server/index.ts
 *
 * Loads .env then .env.local with last-wins semantics.
 * Works without dotenvx (direct tsx or CI environments).
 * TypeScript hoists all imports to top of generated JS, so
 * placing this as first import guarantees it runs before any
 * module that reads process.env (Prisma Pool, etc.).
 */
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'dotenv';

const ROOT = process.cwd();

for (const file of ['.env', '.env.local']) {
  const fp = path.resolve(ROOT, file);
  if (fs.existsSync(fp)) {
    const parsed = parse(fs.readFileSync(fp));
    for (const [k, v] of Object.entries(parsed)) {
      process.env[k] = v;
    }
  }
}

// BE-2: Zod-based fail-fast validation of process.env.
// Importing this module triggers `validate()` as a side effect, AFTER the
// dotenv load above so .env / .env.local values are visible.
//
//   - Production: schema violation OR missing
//     (DATABASE_URL | JWT_SECRET | CORS_ORIGIN) → process.exit(1).
//   - Dev/test: warns to console and continues with safe defaults.
//
// Use `import { env } from './config/env'` for typed access elsewhere.
import './config/env';
