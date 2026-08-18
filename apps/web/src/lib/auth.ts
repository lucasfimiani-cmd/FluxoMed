import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

// ─── Password Hashing (scrypt) ──────────────────────────────────────────────

const HASH_PREFIX = "scrypt$";
const SALT_LEN = 16;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN);
  const derivedKey = scryptSync(password, salt, KEY_LEN);
  return `${HASH_PREFIX}${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX.slice(0, -1)) {
    return false;
  }
  const salt = Buffer.from(parts[1], "base64");
  const expectedHash = Buffer.from(parts[2], "base64");
  const actualHash = scryptSync(password, salt, KEY_LEN);
  if (expectedHash.length !== actualHash.length) return false;
  return timingSafeEqual(expectedHash, actualHash);
}

// ─── Session Token ──────────────────────────────────────────────────────────

const TOKEN_BYTES = 32;
const SESSION_COOKIE = "fluxomed_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

export function createSessionToken(): { token: string; tokenHash: string } {
  const tokenBytes = randomBytes(TOKEN_BYTES);
  const token = tokenBytes.toString("base64url");
  const tokenHash = sha256(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return sha256(token);
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ─── Session Management ─────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  // Renew session if close to expiry
  const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
  if (timeUntilExpiry < RENEW_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export function setSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_MS / 1000}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

export { SESSION_COOKIE };