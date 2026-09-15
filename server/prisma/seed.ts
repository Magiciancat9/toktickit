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
  // Requesters (active) - 4 required
  { name: "Jennifer Anderson", email: "jennifer.anderson@example.com", role: "REQUESTER", isActive: true },
  { name: "Michael Brown",     email: "michael.brown@example.com",    role: "REQUESTER", isActive: true },
  { name: "Sarah Johnson",     email: "sarah.johnson@example.com",    role: "REQUESTER", isActive: true },
  { name: "David Lee",         email: "david.lee@example.com",        role: "REQUESTER", isActive: true },
  
  // Requester (inactive) - 1 required
  { name: "Alex Turner", email: "alex.turner@example.com", role: "REQUESTER", isActive: false },
  
  // IT Staff (active) - 3 required
  { name: "Emma Rodriguez", email: "emma.rodriguez@example.com", role: "IT_STAFF", isActive: true },
  { name: "James Chen",     email: "james.chen@example.com",     role: "IT_STAFF", isActive: true },
  { name: "Sofia Martinez", email: "sofia.martinez@example.com", role: "IT_STAFF", isActive: true },
  
  // IT Staff (inactive) - 1 required
  { name: "Robert Wilson", email: "robert.wilson@example.com", role: "IT_STAFF", isActive: false },
  
  // Administrator (active) - 1 required
  { name: "Admin User", email: "admin@example.com", role: "ADMINISTRATOR", isActive: true },
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

  // 4. Sample Tickets (Lab 3: realistic data with various statuses, priorities, assignments)
  console.log("Seeding sample tickets...");
  
  // Get user IDs for ticket creation
  const jennifer = await prisma.user.findUnique({ where: { email: "jennifer.anderson@example.com" } });
  const michael = await prisma.user.findUnique({ where: { email: "michael.brown@example.com" } });
  const sarah = await prisma.user.findUnique({ where: { email: "sarah.johnson@example.com" } });
  const david = await prisma.user.findUnique({ where: { email: "david.lee@example.com" } });
  const emma = await prisma.user.findUnique({ where: { email: "emma.rodriguez@example.com" } });
  const james = await prisma.user.findUnique({ where: { email: "james.chen@example.com" } });
  const sofia = await prisma.user.findUnique({ where: { email: "sofia.martinez@example.com" } });

  if (!jennifer || !michael || !sarah || !david || !emma || !james || !sofia) {
    console.error("  ✗ Required users not found, skipping ticket creation");
  } else {
    // Get categories and systems
    const accountCategory = await prisma.category.findUnique({ where: { name: "Account and Access" } });
    const hardwareCategory = await prisma.category.findUnique({ where: { name: "Hardware" } });
    const networkCategory = await prisma.category.findUnique({ where: { name: "Network" } });
    const emailSystem = await prisma.relatedSystem.findUnique({ where: { name: "Email" } });
    const wifiSystem = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });
    const laptopSystem = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });

    const tickets = [
      // NEW ticket - unassigned
      {
        ticketNumber: "TKT-2026-000001",
        requesterId: jennifer.id,
        ownerId: null,
        categoryId: accountCategory!.id,
        relatedSystemId: emailSystem!.id,
        summary: "Cannot access email account",
        description: "I am unable to log into my email account. Getting 'invalid credentials' error.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "NEW",
        problemResolvedByRequester: false,
      },
      // OPEN ticket - assigned to Emma
      {
        ticketNumber: "TKT-2026-000002",
        requesterId: michael.id,
        ownerId: emma.id,
        categoryId: networkCategory!.id,
        relatedSystemId: wifiSystem!.id,
        summary: "Wi-Fi connection drops frequently",
        description: "My laptop loses Wi-Fi connection every 10-15 minutes in Building A.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "OPEN",
        problemResolvedByRequester: false,
      },
      // IN_PROGRESS ticket - assigned to James
      {
        ticketNumber: "TKT-2026-000003",
        requesterId: sarah.id,
        ownerId: james.id,
        categoryId: hardwareCategory!.id,
        relatedSystemId: laptopSystem!.id,
        summary: "Laptop won't turn on",
        description: "My corporate laptop does not power on. Tried different power outlets.",
        requestedPriority: "HIGH",
        itPriority: "HIGH",
        status: "IN_PROGRESS",
        problemResolvedByRequester: false,
      },
      // WAITING_FOR_REQUESTER ticket - assigned to Sofia
      {
        ticketNumber: "TKT-2026-000004",
        requesterId: david.id,
        ownerId: sofia.id,
        categoryId: accountCategory!.id,
        relatedSystemId: emailSystem!.id,
        summary: "Need additional mailbox storage",
        description: "My mailbox is almost full. Need more storage space.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "WAITING_FOR_REQUESTER",
        problemResolvedByRequester: false,
      },
      // RESOLVED ticket - assigned to Emma
      {
        ticketNumber: "TKT-2026-000005",
        requesterId: jennifer.id,
        ownerId: emma.id,
        categoryId: networkCategory!.id,
        relatedSystemId: wifiSystem!.id,
        summary: "VPN connection issues",
        description: "Cannot connect to VPN from home.",
        requestedPriority: "MEDIUM",
        itPriority: "MEDIUM",
        status: "RESOLVED",
        problemResolvedByRequester: true,
      },
      // CLOSED ticket - assigned to James
      {
        ticketNumber: "TKT-2026-000006",
        requesterId: michael.id,
        ownerId: james.id,
        categoryId: hardwareCategory!.id,
        relatedSystemId: laptopSystem!.id,
        summary: "Keyboard key stuck",
        description: "The 'E' key on my keyboard is stuck.",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "CLOSED",
        problemResolvedByRequester: false,
      },
      // REOPENED ticket - assigned to Sofia
      {
        ticketNumber: "TKT-2026-000007",
        requesterId: sarah.id,
        ownerId: sofia.id,
        categoryId: accountCategory!.id,
        relatedSystemId: emailSystem!.id,
        summary: "Email forwarding not working",
        description: "Auto-forward to personal email stopped working.",
        requestedPriority: "MEDIUM",
        itPriority: "HIGH",
        status: "REOPENED",
        problemResolvedByRequester: false,
      },
      // CANCELLED ticket - unassigned
      {
        ticketNumber: "TKT-2026-000008",
        requesterId: david.id,
        ownerId: null,
        categoryId: hardwareCategory!.id,
        relatedSystemId: laptopSystem!.id,
        summary: "Request for new mouse",
        description: "Would like a wireless mouse. (Duplicate request, cancelling)",
        requestedPriority: "LOW",
        itPriority: "LOW",
        status: "CANCELLED",
        problemResolvedByRequester: false,
      },
    ];

    for (const ticketData of tickets) {
      await prisma.ticket.upsert({
        where: { ticketNumber: ticketData.ticketNumber },
        update: {},
        create: ticketData as any,
      });
      console.log(`  ✓ Ticket: ${ticketData.ticketNumber} (${ticketData.status})`);
    }
  }

  // 5. Sample Public Comments (Lab 3: visible to all)
  console.log("Seeding sample public comments...");
  const ticket2 = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-2026-000002" } });
  const ticket3 = await prisma.ticket.findUnique({ where: { ticketNumber: "TKT-2026-000003" } });
  
  if (ticket2 && emma && michael) {
    await prisma.publicComment.upsert({
      where: { id: 1 },
      update: {},
      create: {
        ticketId: ticket2.id,
        authorId: emma.id,
        content: "I've checked your network settings. Can you try restarting your laptop and testing again?",
      },
    });
    await prisma.publicComment.upsert({
      where: { id: 2 },
      update: {},
      create: {
        ticketId: ticket2.id,
        authorId: michael.id,
        content: "Restarted the laptop. Issue still persists. Happens in conference room 3A specifically.",
      },
    });
    console.log(`  ✓ Public Comments for ${ticket2.ticketNumber}`);
  }

  if (ticket3 && james && sarah) {
    await prisma.publicComment.upsert({
      where: { id: 3 },
      update: {},
      create: {
        ticketId: ticket3.id,
        authorId: james.id,
        content: "I've ordered a replacement battery. Will install it once it arrives.",
      },
    });
    await prisma.publicComment.upsert({
      where: { id: 4 },
      update: {},
      create: {
        ticketId: ticket3.id,
        authorId: sarah.id,
        content: "Thank you! When do you expect it to arrive?",
      },
    });
    console.log(`  ✓ Public Comments for ${ticket3.ticketNumber}`);
  }

  // 6. Sample Internal Notes (Lab 3: visible only to IT Staff and Administrator)
  console.log("Seeding sample internal notes...");
  
  if (ticket2 && emma) {
    await prisma.internalNote.upsert({
      where: { id: 1 },
      update: {},
      create: {
        ticketId: ticket2.id,
        authorId: emma.id,
        content: "Checked logs - appears to be a known issue with Building A access point firmware. Need to schedule maintenance window.",
      },
    });
    console.log(`  ✓ Internal Note for ${ticket2.ticketNumber}`);
  }

  if (ticket3 && james) {
    await prisma.internalNote.upsert({
      where: { id: 2 },
      update: {},
      create: {
        ticketId: ticket3.id,
        authorId: james.id,
        content: "Battery swelling detected. Marked as priority replacement. User should not attempt to charge.",
      },
    });
    console.log(`  ✓ Internal Note for ${ticket3.ticketNumber}`);
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
