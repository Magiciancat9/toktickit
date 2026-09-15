/**
 * Password utilities for Lab 3 authentication.
 * - Password hashing with bcrypt (work factor 10)
 * - Password validation rules (8+ chars, upper, lower, number, special)
 */

import bcrypt from "bcrypt";

const BCRYPT_WORK_FACTOR = 10;

/**
 * Hash a plaintext password using bcrypt.
 * @param password Plaintext password
 * @returns Promise resolving to bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_WORK_FACTOR);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param password Plaintext password
 * @param hash Bcrypt hash
 * @returns Promise resolving to true if match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password against Lab 3 requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 *
 * @param password Plaintext password
 * @returns Object with isValid boolean and array of error messages
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must include at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
