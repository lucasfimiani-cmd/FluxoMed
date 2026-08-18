import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  hashToken,
} from "../auth";
import { RegisterSchema, LoginSchema } from "@fluxomed/shared";

describe("hashPassword / verifyPassword", () => {
  it("should verify correct password", () => {
    const password = "minha-senha-segura-123";
    const hashed = hashPassword(password);
    expect(hashed).toMatch(/^scrypt\$.+\$.+/);
    expect(verifyPassword(password, hashed)).toBe(true);
  });

  it("should reject wrong password", () => {
    const hashed = hashPassword("senha-correta");
    expect(verifyPassword("senha-errada", hashed)).toBe(false);
  });

  it("should reject malformed hash", () => {
    expect(verifyPassword("qualquer", "invalido")).toBe(false);
    expect(verifyPassword("qualquer", "scrypt$abc")).toBe(false);
    expect(verifyPassword("qualquer", "bcrypt$abc$def")).toBe(false);
  });

  it("should produce different hashes for same password", () => {
    const password = "mesma-senha";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });
});

describe("createSessionToken / hashToken", () => {
  it("should produce token and matching hash", () => {
    const { token, tokenHash } = createSessionToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(32);
    expect(tokenHash).toBe(hashToken(token));
    expect(tokenHash).not.toBe(token);
  });

  it("should produce unique tokens", () => {
    const t1 = createSessionToken();
    const t2 = createSessionToken();
    expect(t1.token).not.toBe(t2.token);
    expect(t1.tokenHash).not.toBe(t2.tokenHash);
  });

  it("hashToken should be deterministic", () => {
    const token = "test-token-value";
    expect(hashToken(token)).toBe(hashToken(token));
  });
});

describe("RegisterSchema validation", () => {
  it("should validate valid input", () => {
    const result = RegisterSchema.safeParse({
      name: "Maria",
      email: "maria@exemplo.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short password", () => {
    const result = RegisterSchema.safeParse({
      name: "Maria",
      email: "maria@exemplo.com",
      password: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("8");
    }
  });

  it("should reject invalid email", () => {
    const result = RegisterSchema.safeParse({
      name: "Maria",
      email: "invalido",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = RegisterSchema.safeParse({
      name: "",
      email: "maria@exemplo.com",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginSchema validation", () => {
  it("should validate valid input", () => {
    const result = LoginSchema.safeParse({
      email: "maria@exemplo.com",
      password: "qualquer",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty password", () => {
    const result = LoginSchema.safeParse({
      email: "maria@exemplo.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});