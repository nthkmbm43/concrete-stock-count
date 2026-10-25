import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบนับสต๊อกโรงงานคอนกรีต | Mobile Stock Count",
  description: "ระบบตรวจนับสต๊อกสินค้าและวัตถุดิบโรงงานคอนกรีต แบบโมบายล์ รองรับ Realtime และนับพร้อมกันหลายคน",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ConcreteStock",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full`}>
      <body className="h-full bg-slate-900 font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              borderRadius: "1rem",
              padding: "12px 16px",
              fontFamily: "var(--font-noto-thai)",
              fontSize: "0.925rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            },
          }}
        />
      </body>
    </html>
  );
}
