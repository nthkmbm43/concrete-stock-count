"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";
import { UserProfile } from "@/lib/types";

/**
 * Parses Set-Cookie header strings and sets them into Next.js cookie store
 */
function applySetCookies(cookieStrings: string[], cookieStore: any) {
  for (const cookieStr of cookieStrings) {
    const parts = cookieStr.split(";").map((p) => p.trim());
    if (parts.length === 0) continue;

    const [nameVal, ...attrs] = parts;
    const eqIdx = nameVal.indexOf("=");
    if (eqIdx === -1) continue;

    const name = nameVal.substring(0, eqIdx).trim();
    const value = nameVal.substring(eqIdx + 1).trim();

    const options: any = {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    };

    for (const attr of attrs) {
      const [attrName, attrVal] = attr.split("=");
      const lower = attrName.toLowerCase().trim();
      if (lower === "max-age" && attrVal) {
        options.maxAge = parseInt(attrVal, 10);
      } else if (lower === "expires" && attrVal) {
        options.expires = new Date(attrVal);
      } else if (lower === "path" && attrVal) {
        options.path = attrVal;
      } else if (lower === "samesite" && attrVal) {
        options.sameSite = attrVal.toLowerCase();
      } else if (lower === "secure") {
        options.secure = true;
      }
    }

    cookieStore.set(name, value, options);
  }
}

/**
 * Server Action: Signs in as a demo user and issues a genuine Better Auth session cookie
 * Strictly guarded by server-side DEMO_MODE flag.
 */
export async function loginDemoUserAction(email: string) {
  // 0. CRITICAL SERVER-SIDE DEMO GUARD
  if (process.env.DEMO_MODE !== "true") {
    return {
      success: false,
      error: "การเข้าสู่ระบบแบบ Demo ถูกปิดใช้งานบนระบบนี้ (403 Forbidden: Demo Mode Disabled)",
      statusCode: 403,
    };
  }

  try {
    let cookieStore: any = null;
    try {
      cookieStore = await cookies();
    } catch {
      // Non-request scope or test runner context
    }

    // 1. Authenticate with Better Auth backend
    const res = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password: "Demo1234!",
      },
      asResponse: true,
    });

    if (!res.ok) {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // 2. Set the signed session cookie in Next.js response if cookie store is available
    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") || ""].filter(Boolean);

    if (cookieStore) {
      applySetCookies(setCookies, cookieStore);
    }

    // 3. Fetch profile for UI hydration
    if (db) {
      const [user] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, email.toLowerCase().trim()))
        .limit(1);

      if (user) {
        const [profile] = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, user.id))
          .limit(1);

        const userProfile: UserProfile = {
          id: user.id,
          full_name: profile?.fullName || user.name,
          email: user.email,
          role: (profile?.role || user.role || "STAFF") as "STAFF" | "ADMIN",
          plant_id: profile?.plantId || 1,
          phone: profile?.phone || undefined,
        };

        return { success: true, user: userProfile };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("loginDemoUserAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}

/**
 * Server Action: Signs out and clears session cookies
 */
export async function logoutUserAction() {
  try {
    const cookieStore = await cookies();
    const reqHeaders = await headers();

    await auth.api.signOut({
      headers: reqHeaders,
    });

    // Clear session cookies
    cookieStore.delete("better-auth.session_token");

    return { success: true };
  } catch (err: any) {
    console.error("logoutUserAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการออกจากระบบ" };
  }
}

/**
 * Server Action: Authenticates a user with username/email and password
 * Issues a genuine Better Auth session cookie.
 */
export async function loginUserAction(identifier: string, password: string) {
  try {
    const rawId = identifier?.trim();
    if (!rawId || !password) {
      return { success: false, error: "กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน" };
    }

    let email = rawId.toLowerCase();
    if (rawId === "admin" || rawId === "admin@kcon.co.th") {
      email = "admin@kcon.co.th";
    } else if (rawId === "pcryclc" || rawId === "pcryclc@kcon.co.th") {
      email = "pcryclc@kcon.co.th";
    } else if (db) {
      const [u] = await db
        .select()
        .from(schema.user)
        .where(or(eq(schema.user.name, rawId), eq(schema.user.email, rawId.toLowerCase())))
        .limit(1);
      if (u?.email) {
        email = u.email;
      }
    }

    let cookieStore: any = null;
    try {
      cookieStore = await cookies();
    } catch {
      // Non-request context
    }

    // 1. Authenticate with Better Auth backend
    const res = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
    });

    if (!res.ok) {
      return { success: false, error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // 2. Set the signed session cookie in Next.js response if cookie store is available
    const setCookies = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") || ""].filter(Boolean);

    if (cookieStore) {
      applySetCookies(setCookies, cookieStore);
    }

    // 3. Fetch profile for UI hydration
    if (db) {
      const [user] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, email))
        .limit(1);

      if (user) {
        const [profile] = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, user.id))
          .limit(1);

        const userProfile: UserProfile = {
          id: user.id,
          full_name: profile?.fullName || user.name,
          email: user.email,
          role: (profile?.role || user.role || "STAFF") as "STAFF" | "ADMIN",
          plant_id: profile?.plantId || 1,
          phone: profile?.phone || undefined,
        };

        return { success: true, user: userProfile };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("loginUserAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
  }
}
