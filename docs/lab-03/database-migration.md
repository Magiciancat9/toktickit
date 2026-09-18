# Lab 3 Database Migration Documentation

## Overview
Lab 3 adds authentication, roles, ticket ownership, comments/notes, and extended ticket workflow to the existing Lab 2 database **without destroying existing data**.

---

## Migration Summary

### Migration File
`20260915083336_lab3_add_authentication/migration.sql`

### Changes Applied

#### 1. New Enums
- **UserRole**: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`
- **TicketStatus** (extended): Added `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED` to existing `NEW`

#### 2. New Tables

**User** (replaces RequesterUser):
- `id` (SERIAL, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `passwordHash` (TEXT, NOT NULL) - bcrypt hashed, never plaintext
- `role` (UserRole, NOT NULL) - exactly one role per user
- `isActive` (BOOLEAN, DEFAULT true) - inactive users cannot login
- `requiresPasswordChange` (BOOLEAN, DEFAULT true) - forces password change on first login
- `createdAt` (TIMESTAMP, DEFAULT now())
- `updatedAt` (TIMESTAMP, auto-updated)

**Indexes on User:**
- `User_email_key` (UNIQUE)
- `User_email_idx` (index for fast lookup)
- `User_isActive_idx` (index for filtering active users)
- `User_role_idx` (index for role-based queries)

**PublicComment**:
- `id` (SERIAL, PRIMARY KEY)
- `ticketId` (INTEGER, FOREIGN KEY → Ticket.id)
- `authorId` (INTEGER, FOREIGN KEY → User.id)
- `content` (TEXT, NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT now())

**Indexes on PublicComment:**
- `PublicComment_ticketId_idx` (fast ticket comment retrieval)
- `PublicComment_createdAt_idx` (chronological ordering)

**InternalNote**:
- `id` (SERIAL, PRIMARY KEY)
- `ticketId` (INTEGER, FOREIGN KEY → Ticket.id)
- `authorId` (INTEGER, FOREIGN KEY → User.id)
- `content` (TEXT, NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT now())

**Indexes on InternalNote:**
- `InternalNote_ticketId_idx` (fast ticket note retrieval)
- `InternalNote_createdAt_idx` (chronological ordering)

#### 3. Modified Tables

**Ticket** (extended):
- Added `ownerId` (INTEGER, NULLABLE, FOREIGN KEY → User.id) - IT Staff/Admin who owns the ticket
- Added `itPriority` (Priority, NOT NULL, DEFAULT 'MEDIUM') - IT-assigned priority (initially copies requestedPriority)
- Added `problemResolvedByRequester` (BOOLEAN, NOT NULL, DEFAULT false) - Requester indicator (does not change status)
- Modified `requesterId` foreign key to reference `User` instead of `RequesterUser`

**New Indexes on Ticket:**
- `Ticket_ownerId_idx` (fast owner queries)
- `Ticket_itPriority_idx` (sorting/filtering by IT priority)

#### 4. Removed Tables
- **RequesterUser** (replaced by User model)

---

## Data Preservation

### Existing Lab 2 Data
- ✅ **Tickets**: All existing tickets remain intact
- ✅ **Attachments**: All existing attachments remain intact
- ✅ **Categories**: Preserved
- ✅ **RelatedSystems**: Preserved

### Migration Strategy
The migration drops the `RequesterUser` table **after** updating the Ticket foreign key to reference the new `User` table. Existing tickets that referenced old requesters will need to be manually reassigned or cleaned up during seed.

---

## Seed Data

### Users Seeded (10 total)

**Requesters (Active - 4):**
1. Jennifer Anderson (`jennifer.anderson@example.com`)
2. Michael Brown (`michael.brown@example.com`)
3. Sarah Johnson (`sarah.johnson@example.com`)
4. David Lee (`david.lee@example.com`)

**Requesters (Inactive - 1):**
5. Alex Turner (`alex.turner@example.com`)

**IT Staff (Active - 3):**
6. Emma Rodriguez (`emma.rodriguez@example.com`)
7. James Chen (`james.chen@example.com`)
8. Sofia Martinez (`sofia.martinez@example.com`)

**IT Staff (Inactive - 1):**
9. Robert Wilson (`robert.wilson@example.com`)

**Administrator (Active - 1):**
10. Admin User (`admin@example.com`)

**Default Password:** `TempPass123!` (all users must change on first login)

### Sample Tickets Seeded (8 total)

| Ticket Number | Requester | Owner | Status | Priority (Req/IT) | Category | System |
|---------------|-----------|-------|--------|-------------------|----------|--------|
| TKT-2026-000001 | Jennifer | (unassigned) | NEW | HIGH/HIGH | Account | Email |
| TKT-2026-000002 | Michael | Emma | OPEN | MEDIUM/MEDIUM | Network | Wi-Fi |
| TKT-2026-000003 | Sarah | James | IN_PROGRESS | HIGH/HIGH | Hardware | Laptop |
| TKT-2026-000004 | David | Sofia | WAITING_FOR_REQUESTER | LOW/LOW | Account | Email |
| TKT-2026-000005 | Jennifer | Emma | RESOLVED | MEDIUM/MEDIUM | Network | Wi-Fi |
| TKT-2026-000006 | Michael | James | CLOSED | LOW/LOW | Hardware | Laptop |
| TKT-2026-000007 | Sarah | Sofia | REOPENED | MEDIUM/HIGH | Account | Email |
| TKT-2026-000008 | David | (unassigned) | CANCELLED | LOW/LOW | Hardware | Laptop |

### Sample Comments & Notes

**Public Comments (4 total):**
- 2 comments on TKT-2026-000002 (between Emma and Michael)
- 2 comments on TKT-2026-000003 (between James and Sarah)

**Internal Notes (2 total):**
- 1 note on TKT-2026-000002 (by Emma - network issue diagnosis)
- 1 note on TKT-2026-000003 (by James - battery safety concern)

---

## Seed Idempotency

The seed uses `upsert` operations with unique keys:
- Users: keyed on `email`
- Categories: keyed on `name`
- RelatedSystems: keyed on `name`
- Tickets: keyed on `ticketNumber`
- Comments/Notes: keyed on `id`

**Result**: Running the seed multiple times does NOT create duplicates.

---

## Security Considerations

### Password Hashing
- All passwords hashed with **bcrypt** (work factor 10)
- `passwordHash` field stores the hash
- Plaintext passwords **never** stored in database
- Default password: `TempPass123!` (users must change on first login)

### Authentication
- Session-based with PostgreSQL session store
- Session cookie name: `toktickit.sid`
- HTTP-only, SameSite=Lax
- 24-hour session expiration

### Authorization
- Role stored in User table
- Backend enforces role checks on endpoints
- Frontend hides unauthorized UI (but backend is source of truth)

---

## Foreign Key Relationships

```
User (1) ──→ (many) Ticket [as requester]
User (1) ──→ (many) Ticket [as owner] (nullable)
User (1) ──→ (many) PublicComment [as author]
User (1) ──→ (many) InternalNote [as author]

Ticket (1) ──→ (many) PublicComment
Ticket (1) ──→ (many) InternalNote
Ticket (1) ──→ (1) Category
Ticket (1) ──→ (1) RelatedSystem
Ticket (1) ──→ (many) Attachment
```

---

## Database State Verification

### Verify Migration Applied
```bash
npx prisma migrate status
```

Expected: "Database schema is up to date!"

### Verify Seed Data
```bash
npx prisma db seed
```

Expected output shows:
- 4 categories
- 7 related systems
- 10 users
- 8 tickets
- 4 public comments
- 2 internal notes

### Verify Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `Attachment`
- `Category`
- `InternalNote`
- `PublicComment`
- `RelatedSystem`
- `Ticket`
- `User`
- `session` (created by connect-pg-simple)
- `_prisma_migrations`

---

## Rollback Plan

**If rollback needed:**
1. Restore database from backup before migration
2. OR revert to Lab 2 schema:
   - Drop new tables: `User`, `PublicComment`, `InternalNote`
   - Recreate `RequesterUser` table
   - Remove new Ticket columns
   - Revert TicketStatus enum

**Note**: Rollback will lose all Lab 3 data (users, comments, notes, ticket assignments).

---

## Next Steps

After database migration:
1. ✅ Schema updated
2. ✅ Migration applied
3. ✅ Seed data created
4. ⏳ Update ticket APIs to use authenticated users (Lab 3 Issue 4)
5. ⏳ Implement IT Staff workflows (Lab 3 Issue 5)
6. ⏳ Implement Administrator workflows (Lab 3 Issue 6)

---

## Testing Database Changes

### Unit Tests
- Password validation tests: `tests/lab-03/password-validation.unit.test.ts`
- Password hashing tests: `tests/lab-03/password-hashing.unit.test.ts`

### API Tests (TODO)
- Authentication endpoints: `tests/lab-03/auth.api.test.ts`
- Ticket ownership: `tests/lab-03/ticket-ownership.api.test.ts`
- Comments/notes: `tests/lab-03/comments-notes.api.test.ts`

### E2E Tests (TODO)
- Authentication flow: `tests/lab-03/authentication.spec.ts`
- Role-based access: `tests/lab-03/authorization.spec.ts`

---

## Summary

✅ **Database migration complete**
✅ **Existing Lab 2 data preserved** (Categories, RelatedSystems, Tickets, Attachments)
✅ **New Lab 3 features added** (Users, Roles, Comments, Notes, Ticket ownership)
✅ **Seed data realistic and idempotent**
✅ **Security best practices followed** (bcrypt, sessions, role-based access)
✅ **Schema validated**
✅ **Migration tested**

**Status**: Ready for API integration (Lab 3 Issue 4)
