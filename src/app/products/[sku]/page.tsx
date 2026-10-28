import { Metadata } from "next";
import { connection } from "next/server";
import { getProductBySku } from "@/db/queries/products";
import { ProductPublicView } from "@/components/products/ProductPublicView";

export const instant = false;

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);
  const item = await getProductBySku(decodedSku);

  if (!item) {
    return {
      title: `ไม่พบสินค้า (${decodedSku}) | KCON Warehouse`,
      description: "ระบบตรวจนับคลังสินค้า บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด",
    };
  }

  return {
    title: `${item.sku} - ${item.name} | KCON Warehouse`,
    description: `ข้อมูลสินค้าคงคลัง: ${item.name} ขนาด ${item.size} โรงผลิต ${item.plant_id} บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();
  const { sku } = await params;
  const decodedSku = decodeURIComponent(sku);
  const item = await getProductBySku(decodedSku);

  return <ProductPublicView item={item} skuParam={decodedSku} />;
}
