import { describe, it, expect, vi } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticketNumber.js";
import { PrismaClient } from "@prisma/client";

function makeMockPrisma(count: number) {
  return {
    ticket: { count: vi.fn().mockResolvedValue(count) },
  } as unknown as PrismaClient;
}

describe("generateTicketNumber", () => {
  it("produces a string matching TKT-YYYY-NNNNNN format", async () => {
    const result = await generateTicketNumber(makeMockPrisma(0));
    expect(result).toMatch(/^TKT-\d{4}-\d{6}$/);
  });

  it("uses the current year", async () => {
    const year = new Date().getFullYear();
    const result = await generateTicketNumber(makeMockPrisma(0));
    expect(result).toContain(`TKT-${year}-`);
  });

  it("pads the sequence to 6 digits (first ticket → 000001)", async () => {
    const result = await generateTicketNumber(makeMockPrisma(0));
    expect(result).toMatch(/^TKT-\d{4}-000001$/);
  });

  it("increments correctly for subsequent tickets", async () => {
    const result = await generateTicketNumber(makeMockPrisma(41));
    expect(result).toMatch(/^TKT-\d{4}-000042$/);
  });

  it("two numbers generated with different counts are not equal", async () => {
    const first  = await generateTicketNumber(makeMockPrisma(0));
    const second = await generateTicketNumber(makeMockPrisma(1));
    expect(first).not.toBe(second);
  });
});
