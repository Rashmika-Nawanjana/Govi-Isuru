/**
 * Seed demo agricultural instructors and booking slots for manual booking UI.
 *
 * Usage:
 *   node scripts/seed-manual-booking-demo.js
 *
 * Reads MONGO_URI from ../.env when run from the server directory.
 * Creates one approved demo officer per district and 3 future open slots per officer.
 * Safe to run multiple times: existing demo officers are reused, existing future demo slots are replaced.
 */

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const User = require('../models/User');
const InstructorSlot = require('../models/InstructorSlot');

const MONGO_URI = process.env.MONGO_URI;
const DEMO_PASSWORD = process.env.DEMO_BOOKING_PASSWORD || 'DemoBooking123!';

const DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya'
];

function makeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function makeFutureSlot(dayOffset, startHour, durationHours = 1, minutes = 0) {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, minutes, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);

  return { startAt: start, endAt: end };
}

async function upsertDemoOfficer(district, passwordHash) {
  const slug = makeSlug(district);
  const username = `demo_officer_${slug}`;
  const email = `${username}@demo.goviisuru.lk`;
  const fullName = `Demo Officer ${district}`;

  const update = {
    username,
    fullName,
    email,
    password: passwordHash,
    district,
    dsDivision: district,
    gnDivision: `${district} Town`,
    phone: '0700000000',
    role: 'officer',
    officerId: `DEMO-${slug.toUpperCase()}`,
    department: 'Department of Agriculture',
    designation: 'Agricultural Instructor',
    isApproved: true,
    approvalStatus: 'approved',
    isEmailVerified: true,
    credits: 500,
    dailyLimit: 500
  };

  return User.findOneAndUpdate(
    { email },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function replaceDemoSlotsForOfficer(officer) {
  await InstructorSlot.deleteMany({
    instructorId: officer._id,
    notes: { $regex: /^DEMO_SLOT:/ },
    startAt: { $gte: new Date() }
  });

  const slotTemplates = [
    { dayOffset: 1, startHour: 9, durationHours: 1, mode: 'in_person' },
    { dayOffset: 2, startHour: 14, durationHours: 1, mode: 'phone' },
    { dayOffset: 3, startHour: 10, durationHours: 1, mode: 'video' }
  ];

  const docs = slotTemplates.map((template, index) => {
    const { startAt, endAt } = makeFutureSlot(template.dayOffset, template.startHour, template.durationHours);
    return {
      instructorId: officer._id,
      instructorName: officer.fullName || officer.username,
      district: officer.district,
      dsDivision: officer.dsDivision,
      gnDivision: officer.gnDivision,
      startAt,
      endAt,
      mode: template.mode,
      locationText: template.mode === 'in_person'
        ? `${officer.district} Agrarian Service Center`
        : template.mode === 'phone'
          ? 'Phone consultation'
          : 'Google Meet / WhatsApp video',
      notes: `DEMO_SLOT:${index + 1}`,
      status: 'open'
    };
  });

  await InstructorSlot.insertMany(docs);
  return docs.length;
}

async function seed() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add it to the root .env file before running this script.');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let officerCount = 0;
  let slotCount = 0;

  for (const district of DISTRICTS) {
    const officer = await upsertDemoOfficer(district, passwordHash);
    officerCount += 1;
    slotCount += await replaceDemoSlotsForOfficer(officer);
  }

  console.log(`Seeded ${officerCount} demo officers and ${slotCount} future open slots.`);
  console.log(`Demo officer password: ${DEMO_PASSWORD}`);
  console.log('Example demo officer username: demo_officer_matara');

  await mongoose.disconnect();
}

seed()
  .then(() => {
    console.log('Manual booking demo seed completed successfully.');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Manual booking demo seed failed:', err.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors on failure
    }
    process.exit(1);
  });
