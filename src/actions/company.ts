"use server";

import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { CompanySettingsData, DEFAULT_KCON_COMPANY_SETTINGS } from "@/db/queries/company";

export async function updateCompanySettingsAction(
  data: Partial<CompanySettingsData>,
  adminRole: string
) {
  if (adminRole !== "ADMIN") {
    return { success: false, error: "ต้องใช้สิทธิ์ผู้ดูแลระบบ (ADMIN) ในการแก้ไขข้อมูลองค์กร" };
  }

  try {
    const now = new Date();

    if (isDatabaseConfigured && db) {
      await db
        .insert(schema.companySettings)
        .values({
          id: "default",
          companyNameTh: data.companyNameTh || DEFAULT_KCON_COMPANY_SETTINGS.companyNameTh,
          companyNameEn: data.companyNameEn || DEFAULT_KCON_COMPANY_SETTINGS.companyNameEn,
          brandName: data.brandName || DEFAULT_KCON_COMPANY_SETTINGS.brandName,
          addressTh: data.addressTh || DEFAULT_KCON_COMPANY_SETTINGS.addressTh,
          phone: data.phone || DEFAULT_KCON_COMPANY_SETTINGS.phone,
          email: data.email || DEFAULT_KCON_COMPANY_SETTINGS.email,
          website: data.website || DEFAULT_KCON_COMPANY_SETTINGS.website,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : null,
          reportFooter: data.reportFooter || DEFAULT_KCON_COMPANY_SETTINGS.reportFooter,
          dataSourceNotice: data.dataSourceNotice || DEFAULT_KCON_COMPANY_SETTINGS.dataSourceNotice,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.companySettings.id,
          set: {
            companyNameTh: data.companyNameTh,
            companyNameEn: data.companyNameEn,
            brandName: data.brandName,
            addressTh: data.addressTh,
            phone: data.phone,
            email: data.email,
            website: data.website,
            logoUrl: data.logoUrl,
            reportFooter: data.reportFooter,
            dataSourceNotice: data.dataSourceNotice,
            updatedAt: now,
          },
        });
    }

    revalidatePath("/");
    revalidatePath("/admin/company");
    revalidatePath("/admin/import");

    return { success: true };
  } catch (err: any) {
    console.error("updateCompanySettingsAction error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลองค์กร" };
  }
}
