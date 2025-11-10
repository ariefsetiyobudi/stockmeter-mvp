import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed Provider Status
  console.log('Seeding provider status...');
  
  const providers = [
    { provider: 'yahoo_finance', status: 'active', remainingCalls: null },
    { provider: 'fmp', status: 'active', remainingCalls: 500 },
    { provider: 'alpha_vantage', status: 'active', remainingCalls: 500 },
  ];

  for (const providerData of providers) {
    await prisma.providerStatus.upsert({
      where: { provider: providerData.provider },
      update: {},
      create: providerData,
    });
  }

  console.log('Provider status seeded successfully');

  // Seed Test Users for Development
  console.log('Seeding test users...');

  const testUsers = [
    {
      email: 'free@test.com',
      name: 'Free User',
      password: 'password123',
      subscriptionStatus: 'free',
      subscriptionExpiry: null,
    },
    {
      email: 'pro@test.com',
      name: 'Pro User',
      password: 'password123',
      subscriptionStatus: 'pro',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  ];

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        authProvider: 'email',
        subscriptionStatus: userData.subscriptionStatus,
        subscriptionExpiry: userData.subscriptionExpiry,
        languagePreference: 'en',
        currencyPreference: 'USD',
      },
    });
  }

  console.log('Test users seeded successfully');

  // Seed some sample watchlist items for the pro user
  console.log('Seeding sample watchlist...');
  
  const proUser = await prisma.user.findUnique({
    where: { email: 'pro@test.com' },
  });

  if (proUser) {
    const sampleTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    for (const ticker of sampleTickers) {
      await prisma.watchlist.upsert({
        where: {
          userId_ticker: {
            userId: proUser.id,
            ticker,
          },
        },
        update: {},
        create: {
          userId: proUser.id,
          ticker,
        },
      });
    }
  }

  console.log('Sample watchlist seeded successfully');

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
