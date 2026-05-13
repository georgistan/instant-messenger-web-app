import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  const channels = [
    { name: 'general', description: 'Company-wide announcements and work-based matters' },
    { name: 'engineering', description: 'Tech talk, code reviews, and deployments' },
    { name: 'random', description: 'Non-work banter and water cooler conversation' },
  ];

  for (const c of channels) {
    await prisma.channel.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log('Database seeded with default channels.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
