import { connection } from "next/server";
import { getCompanySettings } from "@/db/queries/company";
import { getCurrentUser } from "@/db/queries";
import { DataImportPageClient } from "@/components/admin/DataImportPageClient";

export const metadata = {
  title: "ศูนย์นำเข้าข้อมูล (Data Import Center) | KCON Concrete",
  description: "นำเข้า Master สินค้าคอนกรีต สต๊อกยกมา และจุดวางคลังสินค้า",
};

export const instant = false;

export default async function AdminImportPage() {
  await connection();
  const [companySettings, currentUser] = await Promise.all([
    getCompanySettings(),
    getCurrentUser(),
  ]);

  return (
    <DataImportPageClient
      initialCompanySettings={companySettings}
      currentUser={{
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
      }}
    />
  );
}
