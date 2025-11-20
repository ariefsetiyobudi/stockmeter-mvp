"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seed...');
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
            subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
//# sourceMappingURL=seed.js.map