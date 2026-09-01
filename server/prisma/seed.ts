import { getPrisma } from "../src/prisma.js";

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
];

const RELATED_SYSTEMS = [
  "Email",
  "Campus Wi-Fi",
  "VPN",
  "LEB2 App",
  "Grade Submission App",
  "Corporate Laptop",
  "Printer",
];

const ACTIVE_REQUESTERS = [
  { name: "Jennifer Anderson", email: "jennifer.anderson@example.com" },
  { name: "Michael Brown",    email: "michael.brown@example.com" },
  { name: "Sarah Johnson",    email: "sarah.johnson@example.com" },
  { name: "David Lee",        email: "david.lee@example.com" },
];

const INACTIVE_REQUESTERS = [
  { name: "Alex Turner", email: "alex.turner@example.com" },
];

// ---------------------------------------------------------------------------
// Main seed function — idempotent (safe to re-run without creating duplicates)
// All records use upsert keyed on their unique field.
// ---------------------------------------------------------------------------

async function main() {
  const prisma = getPrisma();

  // 1. Categories (Lab 1 Issue 3 — kept here so seed is self-contained)
  console.log("Seeding categories...");
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where:  { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ Category: ${name}`);
  }

  // 2. Related Systems
  console.log("Seeding related systems...");
  for (const name of RELATED_SYSTEMS) {
    await prisma.relatedSystem.upsert({
      where:  { name },
      update: {},
      create: { name, isActive: true },
    });
    console.log(`  ✓ RelatedSystem: ${name}`);
  }

  // 3. Active Requesters
  console.log("Seeding active requesters...");
  for (const { name, email } of ACTIVE_REQUESTERS) {
    await prisma.requesterUser.upsert({
      where:  { email },
      update: { name, isActive: true },
      create: { name, email, isActive: true },
    });
    console.log(`  ✓ Requester (active): ${name}`);
  }

  // 4. Inactive Requesters
  console.log("Seeding inactive requesters...");
  for (const { name, email } of INACTIVE_REQUESTERS) {
    await prisma.requesterUser.upsert({
      where:  { email },
      update: { name, isActive: false },
      create: { name, email, isActive: false },
    });
    console.log(`  ✓ Requester (inactive): ${name}`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
