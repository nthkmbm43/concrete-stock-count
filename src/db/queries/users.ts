import { cache } from "react";
import { db, schema, isDatabaseConfigured } from "@/db";
import { UserProfile } from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";

export const getCurrentUser = cache(async (): Promise<UserProfile> => {
  return DataProvider.getCurrentUserSync();
});

export const getUserList = cache(async (): Promise<UserProfile[]> => {
  return DataProvider.getUsersSync();
});
