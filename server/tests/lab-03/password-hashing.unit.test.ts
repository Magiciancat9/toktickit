/**
 * Unit tests for password hashing (Lab 3).
 * Tests BR-07 (bcrypt hashing).
 */

import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../src/utils/password.js";

describe("Password Hashing (UNIT-04, UNIT-05)", () => {
  it("should hash password to a different value (never plaintext)", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toContain("$2"); // bcrypt hashes start with $2a$ or $2b$
    expect(hash.length).toBeGreaterThan(50);
  });

  it("should produce different hashes for the same password (salt)", async () => {
    const password = "SecurePass123!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2); // Different salts
  });

  it("should correctly verify correct password", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    const isValid = await comparePassword("WrongPassword!", hash);
    expect(isValid).toBe(false);
  });
});
