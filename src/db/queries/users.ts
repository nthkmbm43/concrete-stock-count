import { cache } from "react";
import { UserProfile } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";
import { getOptionalUser } from "@/lib/auth/server";
import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const authUser = await getOptionalUser();
  if (authUser) {
    return {
      id: authUser.id,
      full_name: authUser.fullName,
      email: authUser.email,
      role: authUser.role,
      plant_id: authUser.plantId,
      phone: authUser.phone,
    };
  }
  return null;
});

export const getUserList = cache(async (): Promise<UserProfile[]> => {
  if (isDatabaseConfigured && db) {
    try {
      const rows = await db
        .select({
          user: schema.user,
          profile: schema.profiles,
        })
        .from(schema.user)
        .leftJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId));

      return rows.map((r) => ({
        id: r.user.id,
        full_name: r.profile?.fullName || r.user.name,
        email: r.user.email,
        role: (r.profile?.role || r.user.role || "STAFF") as "STAFF" | "ADMIN",
        plant_id: r.profile?.plantId || 1,
        phone: r.profile?.phone || undefined,
      }));
    } catch (err) {
      console.warn("getUserList DB query error, using fallback:", err);
    }
  }
  return DataProvider.getUsersSync();
});
