import { db, schema, isDatabaseConfigured } from "@/db";
import { eq } from "drizzle-orm";

export interface CompanySettingsData {
  id: string;
  companyNameTh: string;
  companyNameEn: string;
  brandName: string;
  addressTh: string;
  phone: string | null;
  email: string;
  website: string;
  logoUrl: string | null;
  reportFooter: string | null;
  dataSourceNotice: string | null;
  updatedAt?: Date;
}

export const DEFAULT_KCON_COMPANY_SETTINGS: CompanySettingsData = {
  id: "default",
  companyNameTh: "บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
  companyNameEn: "KHON KAEN CONCRETE PRODUCT CO., LTD.",
  brandName: "KCON",
  addressTh: "154 หมู่ 9 ถนนมะลิวัลย์ ตำบลบ้านทุ่ม อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000",
  phone: "043-255-111",
  email: "kcon.eng@gmail.com",
  website: "www.kcon-concrete.com",
  logoUrl: null,
  reportFooter: "เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting",
  dataSourceNotice: "ข้อมูลเริ่มต้นจากแหล่งข้อมูลสาธารณะของบริษัท",
};

/**
 * Fetches company settings from DB or returns verifiable KCON public data defaults
 */
export async function getCompanySettings(): Promise<CompanySettingsData> {
  if (!isDatabaseConfigured || !db) {
    return DEFAULT_KCON_COMPANY_SETTINGS;
  }

  try {
    const [row] = await db
      .select()
      .from(schema.companySettings)
      .where(eq(schema.companySettings.id, "default"))
      .limit(1);

    if (!row) {
      return DEFAULT_KCON_COMPANY_SETTINGS;
    }

    return {
      id: row.id,
      companyNameTh: row.companyNameTh,
      companyNameEn: row.companyNameEn,
      brandName: row.brandName,
      addressTh: row.addressTh,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logoUrl: row.logoUrl,
      reportFooter: row.reportFooter,
      dataSourceNotice: row.dataSourceNotice,
      updatedAt: row.updatedAt,
    };
  } catch (err) {
    console.error("Error reading company settings:", err);
    return DEFAULT_KCON_COMPANY_SETTINGS;
  }
}
