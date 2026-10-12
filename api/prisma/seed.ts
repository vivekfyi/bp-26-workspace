import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const seedUserEmail = process.env.SEED_USER_EMAIL;

  if (!seedUserEmail) {
    return;
  }

  await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: {},
    create: {
      email: seedUserEmail,
      passwordHash: null,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
