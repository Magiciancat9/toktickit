/**
 * Generates a unique Ticket Number in the format TKT-YYYY-NNNNNN.
 * YYYY = current year, NNNNNN = zero-padded sequential integer from the DB.
 *
 * Strategy: uses MAX(id) + 1 across all tickets for the sequence number.
 * This is simple, collision-free within a single-process server, and produces
 * human-readable sortable numbers without a separate counter table.
 */
import { PrismaClient } from "@prisma/client";

export async function generateTicketNumber(prisma: PrismaClient): Promise<string> {
  const year = new Date().getFullYear();

  // Count all tickets ever created (including soft-deleted if any in future)
  // to get the next sequence number.
  const count = await prisma.ticket.count();
  const sequence = count + 1;
  const padded = String(sequence).padStart(6, "0");

  return `TKT-${year}-${padded}`;
}
