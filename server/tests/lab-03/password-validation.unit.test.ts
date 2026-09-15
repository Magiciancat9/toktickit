/**
 * Unit tests for password validation (Lab 3).
 * Tests BR-03 and BR-04 (password requirements).
 */

import { describe, it, expect } from "vitest";
import { validatePassword } from "../../src/utils/password.js";

describe("Password Validation (UNIT-01, UNIT-02, UNIT-03)", () => {
  it("should reject passwords shorter than 8 characters", () => {
    const result = validatePassword("Short1!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters");
  });

  it("should reject passwords without uppercase letter", () => {
    const result = validatePassword("lowercase123!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must include at least one uppercase letter"
    );
  });

  it("should reject passwords without lowercase letter", () => {
    const result = validatePassword("UPPERCASE123!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must include at least one lowercase letter"
    );
  });

  it("should reject passwords without a number", () => {
    const result = validatePassword("NoNumbers!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must include at least one number");
  });

  it("should reject passwords without a special character", () => {
    const result = validatePassword("NoSpecial123");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must include at least one special character"
    );
  });

  it("should accept valid passwords meeting all requirements", () => {
    const result = validatePassword("SecurePass123!");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return multiple errors for multiple violations", () => {
    const result = validatePassword("bad");
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
