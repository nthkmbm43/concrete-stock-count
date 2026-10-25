"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { revalidatePath } from "next/cache";
import { CompanySettingsData, DEFAULT_KCON_COMPANY_SETTINGS } from "@/db/queries/company";
import { requireAdmin } from "@/lib/auth/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/permissions";

/**
 * 7, 8. Admin Company Settings Update
 * Identity & ADMIN authorization strictly verified on the server via Better Auth + DB.
 * Client cannot pass or spoof role.
 */
export async function updateCompanySettingsAction(data: Partial<CompanySettingsData>) {
  try {
    // 1. Authenticate & Authorize strictly on server
    const admin = await requireAdmin();
    const now = new Date();

    // 2. Sanitize and validate input
    const sanitizedData = {
      companyNameTh: data.companyNameTh?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.companyNameTh,
      companyNameEn: data.companyNameEn?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.companyNameEn,
      brandName: data.brandName?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.brandName,
      addressTh: data.addressTh?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.addressTh,
      phone: data.phone?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.phone,
      email: data.email?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.email,
      website: data.website?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.website,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : null,
      reportFooter: data.reportFooter?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.reportFooter,
      dataSourceNotice:
        data.dataSourceNotice?.trim() || DEFAULT_KCON_COMPANY_SETTINGS.dataSourceNotice,
    };

    if (isDatabaseConfigured && db) {
      await db
        .insert(schema.companySettings)
        .values({
          id: "default",
          ...sanitizedData,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.companySettings.id,
          set: {
            ...sanitizedData,
            updatedAt: now,
          },
        });
    }

    revalidatePath("/");
    revalidatePath("/admin/company");
    revalidatePath("/admin/import");
    revalidatePath("/reports/print");

    return {
      success: true,
      updatedBy: admin.fullName,
    };
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { success: false, error: err.message, statusCode: err.statusCode };
    }
    console.error("updateCompanySettingsAction error:", err);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลองค์กร" };
  }
}
