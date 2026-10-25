import { NextRequest, NextResponse } from "next/server";
import { getReportData, ReportQueryOptions } from "@/db/queries/reports";
import { generateStockCountPdf } from "@/lib/export/pdf-generator";
import { getOptionalUser } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getOptionalUser();
    if (!user) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลดรายงาน (401 Unauthorized)" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const scope = (searchParams.get("scope") as "current_stock" | "count_round") || "count_round";
    const roundId = searchParams.get("roundId") || undefined;
    const plantIdStr = searchParams.get("plantId");
    const plantId = plantIdStr ? parseInt(plantIdStr, 10) : undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const differenceOnly = searchParams.get("differenceOnly") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || "sku";

    const options: ReportQueryOptions = {
      scope,
      roundId,
      plantId: isNaN(plantId as number) ? undefined : plantId,
      categoryId,
      differenceOnly,
      sortBy,
    };

    const reportData = await getReportData(options);
    const pdfBuffer = await generateStockCountPdf(reportData);

    const safeTitle = (reportData.summary.roundName || "Stock_Count")
      .replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")
      .substring(0, 40);
    const dateStr = new Date().toISOString().split("T")[0];
    const asciiFilename = `Stock_Report_${scope}_${dateStr}.pdf`;
    const encodedFilename = encodeURIComponent(`Stock_Report_${safeTitle}_${dateStr}.pdf`);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_")) {
      throw err;
    }
    console.error("PDF Export Error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF report", details: err.message },
      { status: 500 }
    );
  }
}
