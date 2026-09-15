import { getPrisma } from "../src/prisma.js";
import { hashPassword } from "../src/utils/password.js";

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

// Lab 3: Users with roles and authentication.
// Default password for all test users: "TempPass123!" (must be changed on first login).
const DEFAULT_PASSWORD = "TempPass123!";

const USERS = [
  // Requesters (active)
  { name: "Jennifer Anderson", email: "jennifer.anderson@example.com", role: "REQUESTER", isActive: true },
  { name: "Michael Brown",     email: "michael.brown@example.com",    role: "REQUESTER", isActive: true },
  { name: "Sarah Johnson",     email: "sarah.johnson@example.com",    role: "REQUESTER", isActive: true },
  { name: "David Lee",         email: "david.lee@example.com",        role: "REQUESTER", isActive: true },
  
  // Requester (inactive)
  { name: "Alex Turner", email: "alex.turner@example.com", role: "REQUESTER", isActive: false },
  
  // IT Staff
  { name: "IT Staff Member", email: "it.staff@example.com", role: "IT_STAFF", isActive: true },
  
  // Administrator
  { name: "System Administrator", email: "admin@example.com", role: "ADMINISTRATOR", isActive: true },
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

  // 3. Users (Lab 3: replaces RequesterUser, adds IT Staff and Administrator)
  console.log("Seeding users...");
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  
  for (const { name, email, role, isActive } of USERS) {
    await prisma.user.upsert({
      where:  { email },
      update: { 
        name, 
        role: role as any,
        isActive,
        // Note: Do not update passwordHash or requiresPasswordChange on update
        // to preserve user's existing password and password-change status
      },
      create: { 
        name, 
        email,
        passwordHash,
        role: role as any,
        isActive,
        requiresPasswordChange: true, // All seed users must change password on first login
      },
    });
    console.log(`  ✓ User (${role}, ${isActive ? 'active' : 'inactive'}): ${name}`);
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
