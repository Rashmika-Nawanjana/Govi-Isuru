/**
 * Seed the shared demo account the WhatsApp bot falls back to for guests.
 *
 * Usage:
 *   node scripts/seed-whatsapp-demo.js
 *
 * Judges scanning the poster QR have no Govi Isuru account. Rather than
 * stopping them at a login wall, the bot runs credit-costing features against
 * this profile. It is premium with a raised daily limit so a busy judging
 * session cannot exhaust it mid-demo.
 *
 * Safe to run repeatedly - the account is upserted, never duplicated.
 */

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;
const USERNAME = process.env.WHATSAPP_DEMO_USERNAME || 'demo-judge';
const PASSWORD = process.env.WHATSAPP_DEMO_PASSWORD || 'GoviIsuruDemo123!';
const DAILY_LIMIT = Number(process.env.WHATSAPP_DEMO_DAILY_LIMIT || 100000);

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to .env before seeding.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: USERNAME });

  if (existing) {
    existing.credits = DAILY_LIMIT;
    existing.dailyLimit = DAILY_LIMIT;
    existing.isPremium = true;
    existing.isApproved = true;
    existing.isEmailVerified = true;
    existing.lastCreditReset = new Date();
    await existing.save();
    console.log(`Refreshed ${USERNAME}: ${DAILY_LIMIT} credits, premium.`);
  } else {
    await User.create({
      username: USERNAME,
      fullName: 'Govi Isuru Demo',
      email: `${USERNAME}@legacy.goviisuru.lk`,
      password: await bcrypt.hash(PASSWORD, 10),
      district: 'Anuradhapura',
      dsDivision: 'Nuwaragam Palatha Central',
      gnDivision: 'Demo GN Division',
      role: 'farmer',
      credits: DAILY_LIMIT,
      dailyLimit: DAILY_LIMIT,
      isPremium: true,
      isApproved: true,
      isEmailVerified: true
    });
    console.log(`Created ${USERNAME} with ${DAILY_LIMIT} credits.`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
