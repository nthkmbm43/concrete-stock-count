import { cache } from "react";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq, and, or, gt } from "drizzle-orm";
import {
  UnauthorizedError,
  ForbiddenError,
  AuthenticatedUser,
} from "./permissions";

/**
 * Reads and verifies the active Better Auth session from incoming request headers.
 * Includes multi-layer fallback to verify cookies directly against the session database,
 * preventing any proxy, TLS, or cookie prefix (__Secure-) mismatches.
 */
export const getServerSession = cache(async () => {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({
      headers: reqHeaders,
    });
    if (session && session.user && session.session) {
      return session;
    }

    // Resilient fallback: Support both __Secure- and un-prefixed session token cookies
    const cookieStore = await cookies();
    const token =
      cookieStore.get("__Secure-better-auth.session_token")?.value ||
      cookieStore.get("better-auth.session_token")?.value;

    if (token && db && isDatabaseConfigured) {
      // In Better Auth, token may be signed: "rawToken.signature"
      const rawToken = token.includes(".") ? token.split(".")[0] : token;

      const [foundSession] = await db
        .select()
        .from(schema.session)
        .where(
          and(
            or(
              eq(schema.session.token, token),
              eq(schema.session.token, rawToken)
            ),
            gt(schema.session.expiresAt, new Date())
          )
        )
        .limit(1);

      if (foundSession) {
        const [foundUser] = await db
          .select()
          .from(schema.user)
          .where(eq(schema.user.id, foundSession.userId))
          .limit(1);

        if (foundUser) {
          return {
            user: foundUser,
            session: foundSession,
          } as any;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Error reading server session from Better Auth:", err);
    return null;
  }
});

/**
 * 4. requireSession()
 * Ensures request has an active Better Auth session.
 * Throws UnauthorizedError (401) if missing or expired.
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session || !session.user || !session.session) {
    throw new UnauthorizedError("กรุณาเข้าสู่ระบบก่อนดำเนินการ (401 Unauthorized)");
  }
  return session;
}

/**
 * 6. DATABASE ROLE AS SOURCE OF TRUTH
 * Retrieves the authenticated user and queries their profile role directly from the database.
 * Cached at the React request level to prevent N+1 queries.
 */
export const requireUser = cache(async (): Promise<AuthenticatedUser> => {
  const session = await requireSession();
  const userId = session.user.id;

  if (!isDatabaseConfigured || !db) {
    // Database must be configured in production
    throw new UnauthorizedError("ระบบฐานข้อมูลไม่พร้อมใช้งาน");
  }

  // 1. Fetch user & profile from DB as the single source of truth
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const [dbUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!dbUser) {
    throw new UnauthorizedError("ไม่พบข้อมูลผู้ใช้งานในระบบ (401)");
  }

  // Role must come from profiles.role (or dbUser.role as secondary database field), NEVER client
  const role = (profile?.role || dbUser.role || "STAFF") as "STAFF" | "ADMIN";

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role,
    profileId: profile?.id || `prof-${dbUser.id}`,
    fullName: profile?.fullName || dbUser.name,
    employeeCode: profile?.employeeCode || undefined,
    plantId: profile?.plantId || 1,
    phone: profile?.phone || undefined,
  };
});

/**
 * 5. requireAdmin()
 * Verifies that the authenticated user has ADMIN privileges.
 * Throws ForbiddenError (403) if user is not an administrator.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError(
      "คุณไม่มีสิทธิ์ในการดำเนินการนี้ จำเป็นต้องใช้สิทธิ์ผู้ดูแลระบบ (403 Forbidden)"
    );
  }
  return user;
}

/**
 * 15. requireStaffOrAdmin()
 * Verifies that the authenticated user has STAFF or ADMIN privileges.
 */
export async function requireStaffOrAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "STAFF" && user.role !== "ADMIN") {
    throw new ForbiddenError("คุณไม่มีสิทธิ์ในการดำเนินการนี้ (403 Forbidden)");
  }
  return user;
}

/**
 * Helper to get user profile if session exists, without throwing
 */
export const getOptionalUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const session = await getServerSession();
    if (!session || !session.user) return null;

    if (!isDatabaseConfigured || !db) return null;

    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, session.user.id))
      .limit(1);

    const [dbUser] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .limit(1);

    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: (profile?.role || dbUser.role || "STAFF") as "STAFF" | "ADMIN",
      profileId: profile?.id || `prof-${dbUser.id}`,
      fullName: profile?.fullName || dbUser.name,
      employeeCode: profile?.employeeCode || undefined,
      plantId: profile?.plantId || 1,
      phone: profile?.phone || undefined,
    };
  } catch {
    return null;
  }
});
