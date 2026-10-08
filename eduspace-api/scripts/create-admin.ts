import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run admin:create -- <admin-email>");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    throw new Error("An account already exists for this email. No account or password was changed.");
  }

  const password = `${randomBytes(32).toString("base64url")}Aa1!`;
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: "EduSpace Administrator",
      email,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin account created for ${email}. Save this one-time password securely: ${password}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin account could not be created.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
