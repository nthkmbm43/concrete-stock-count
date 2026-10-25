import { cache } from "react";
import { UserProfile } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";
import { getOptionalUser } from "@/lib/auth/server";

export const getCurrentUser = cache(async (): Promise<UserProfile> => {
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
  return DataProvider.getCurrentUserSync();
});

export const getUserList = cache(async (): Promise<UserProfile[]> => {
  return DataProvider.getUsersSync();
});
