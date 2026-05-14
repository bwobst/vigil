/**
 * Operator CLI for user provisioning.
 *
 * Usage:
 *   node dist/cli/operator.js create-user --email <email> --password <password>
 *   node dist/cli/operator.js reset-password --email <email> --password <new-password>
 *
 * Environment:
 *   DATABASE_URL — PostgreSQL connection string (required)
 *
 * First-deploy notes:
 *   - Run `prisma migrate deploy` before first use.
 *   - Start with an empty watches table (no legacy row backfill for Watch.userId).
 *   - Create the first operator user with `create-user` after migration.
 */

import { PrismaClient } from "@prisma/client";
import { normalizeEmail, validatePassword } from "../password/password-policy";
import { hashPassword } from "../password/password-hash";

function parseArgs(argv: string[]): { command: string; email: string; password: string } {
  const args = argv.slice(2);
  const command = args[0] ?? "";

  const emailIdx = args.indexOf("--email");
  const passwordIdx = args.indexOf("--password");

  const email = emailIdx !== -1 ? (args[emailIdx + 1] ?? "") : "";
  const password = passwordIdx !== -1 ? (args[passwordIdx + 1] ?? "") : "";

  return { command, email, password };
}

async function createUser(prisma: PrismaClient, email: string, password: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    console.error("Error: --email is required");
    process.exit(1);
  }

  const policy = validatePassword(password);
  if (!policy.valid) {
    console.error("Error: password does not meet policy requirements:");
    for (const err of policy.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    console.error(`Error: user with email "${normalized}" already exists`);
    process.exit(1);
  }

  const hashed = await hashPassword(password);
  await prisma.user.create({ data: { email: normalized, password: hashed } });
  console.log(`User created: ${normalized}`);
}

async function resetPassword(prisma: PrismaClient, email: string, password: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    console.error("Error: --email is required");
    process.exit(1);
  }

  const policy = validatePassword(password);
  if (!policy.valid) {
    console.error("Error: password does not meet policy requirements:");
    for (const err of policy.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    console.error(`Error: no user found with email "${normalized}"`);
    process.exit(1);
  }

  const hashed = await hashPassword(password);
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
  ]);
  console.log(`Password reset for: ${normalized}`);
  console.log("All sessions for this user have been invalidated.");
}

async function main() {
  const { command, email, password } = parseArgs(process.argv);

  if (!command || (command !== "create-user" && command !== "reset-password")) {
    console.error("Usage:");
    console.error("  node dist/cli/operator.js create-user --email <email> --password <password>");
    console.error("  node dist/cli/operator.js reset-password --email <email> --password <password>");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    if (command === "create-user") {
      await createUser(prisma, email, password);
    } else {
      await resetPassword(prisma, email, password);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
