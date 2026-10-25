# Concrete Stock Count — Mobile Stock Counting Application
> **Full Stack Mobile Stock Counting App for Concrete Factory Operations**  
> Built with **Next.js (App Router + Server Actions) • Neon PostgreSQL • Drizzle ORM • Better Auth • Tailwind CSS**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon_PostgreSQL-00e599?style=flat&logo=postgresql)](https://neon.tech/)
[![ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat)](https://orm.drizzle.team/)
[![Auth](https://img.shields.io/badge/Auth-Better_Auth-blue?style=flat)](https://better-auth.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Business Problem & Overview

In concrete manufacturing plants (producing prestressed fence posts, Hollowcore slabs, concrete piles, retaining L-walls, and raw materials), **a single product SKU is rarely located in a single storage slot**.

Because products are cast and cured across different shifts, identical items (`FP-250-18`) are frequently distributed across multiple storage positions:
- **Lock A3 / Row 6**: 40 units
- **Lock B3 / Row 2**: 20 units
- **Lock B5 / Row 1**: 58 units
- **Total System Stock**: 118 units

Traditional ERP or desktop counting systems force warehouse staff to sum numbers manually on paper, leading to transcription errors, duplicate counts, and lost location data.

### The Solution
**Concrete Stock Count** is a mobile-first digital counting application engineered specifically for floor warehouse workers and yard supervisors:
1. **Multi-Location Counting by Lock & Row**: Count items at each individual yard position with instant calculation of total and variance.
2. **Master Location vs. Observed Location**: Distinguishes between system-designated positions and newly discovered physical yard locations (`จุดวางใหม่`) without corrupting master records.
3. **Atomic Server Transactions**: Submitting a stock count triggers an ACID PostgreSQL transaction (`BEGIN ... COMMIT`) that updates the count log, stores location breakdowns, and updates current product stock.
4. **Recount & History Auditing**: Re-counting an SKU creates an immutable audit trail without overwriting historical records.
5. **Role-Based Security**: Strict separation between `STAFF` (count, draft, submit, add observed locations) and `ADMIN` (stock adjustments, product management, round control).

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Client["Mobile Device (Browser / PWA)"]
        UI["Mobile Shell (390x844 Responsive)"]
        PWA["Offline Cache & Local Drafts"]
    end

    subgraph Vercel["Next.js Full Stack (Vercel Production)"]
        RSC["React Server Components"]
        SA["Server Actions (Atomic Transactions)"]
        BA["Better Auth (Session & RBAC)"]
        API["Route Handlers (/api/auth/[...all])"]
    end

    subgraph Neon["Neon Serverless PostgreSQL"]
        DB[("PostgreSQL Database")]
        ORM["Drizzle ORM Schema & Relations"]
    end

    UI --> RSC
    UI --> SA
    UI --> BA
    SA --> ORM
    BA --> ORM
    ORM --> DB
```

---

## 3. Database Schema (Drizzle ORM)

```mermaid
erDiagram
    user ||--o{ session : "has"
    user ||--o{ account : "has"
    user ||--o| profiles : "details"
    user ||--o{ stock_counts : "submits"
    user ||--o{ stock_adjustments : "adjusts"

    plants ||--o{ products : "manufactures"
    plants ||--o{ storage_locations : "contains"
    plants ||--o{ count_round_plants : "participates"

    product_categories ||--o{ products : "classifies"
    units ||--o{ products : "measures"

    products ||--o{ product_locations : "master_locations"
    storage_locations ||--o{ product_locations : "assigned_to"

    count_rounds ||--o{ count_round_plants : "includes"
    count_rounds ||--o{ stock_counts : "records"

    products ||--o{ stock_counts : "counted_in"
    stock_counts ||--o{ stock_count_locations : "breakdown"
    storage_locations ||--o{ stock_count_locations : "verified_at"
```

---

## 4. Key Features

| Category | Features |
|---|---|
| **Counting Workflow** | Multi-storage counting (Lock/Row), live variance indicator, stepper controls (`-` / `inputMode="numeric"` / `+`), real-time summary |
| **Location Intelligence** | Separates Master Locations from Observed Locations; supports newly discovered locations (`จุดวางใหม่`) with Edit, Delete, and 6-second Undo Toast |
| **Draft & Persistence** | Auto-saves draft count per SKU/Round in localStorage; refresh never loses progress; clears automatically on submit |
| **Product Form UX** | Modern styled bottom sheets for Plant & Category (no browser native `<select>`), searchable combobox for Units with normalization, separate Height/Width/Length inputs with attached unit selectors |
| **Security & Auth** | Better Auth with PostgreSQL session storage, server-side role validation (`STAFF` vs `ADMIN`), registration defaults strictly to `STAFF` |
| **Audit & History** | Complete count timeline with timestamps, employee identity, location breakdowns, and admin adjustments with required reasons |

---

## 5. User Roles & Permissions

| Capability | STAFF | ADMIN |
|---|:---:|:---:|
| Browse Products & Current Stock | :white_check_mark: | :white_check_mark: |
| Count Stock across multiple locations | :white_check_mark: | :white_check_mark: |
| Save Drafts & Submit Counts | :white_check_mark: | :white_check_mark: |
| Add new observed locations (`จุดวางใหม่`) | :white_check_mark: | :white_check_mark: |
| View Count History & Breakdown | :white_check_mark: | :white_check_mark: |
| Create / Edit Products & Dimensions | :x: | :white_check_mark: |
| Adjust Stock Quantities (with reason) | :x: | :white_check_mark: |
| Open / Close Count Rounds | :x: | :white_check_mark: |
| Manage User Roles | :x: | :white_check_mark: |

---

## 6. Demo Accounts & Safety Notice

For portfolio demonstration and testing, the application includes pre-seeded demo accounts with Better Auth credentials:

| Role | Name | Email | Password | Default Plant | Capabilities |
|---|---|---|---|---|---|
| **ADMIN** | ชัยวัฒน์ (หัวหน้าคลัง) | `admin@concretefactory.co.th` | `Demo1234!` **(DEMO ONLY)** | โรง 1 | Full administrative rights (Product CRUD, Stock Adjustments, Round control, Data Import) |
| **STAFF** | สมชาย ใจมั่นคง | `somchai@concretefactory.co.th` | `Demo1234!` **(DEMO ONLY)** | โรง 1 | Raw materials warehouse counting |
| **STAFF** | วิชัย สุวรรณโชติ | `wichai@concretefactory.co.th` | `Demo1234!` **(DEMO ONLY)** | โรง 2 | Finished goods counting (featured post `FP-250-18`) |
| **STAFF** | นิตยา รักษ์พงษ์ | `nittaya@concretefactory.co.th` | `Demo1234!` **(DEMO ONLY)** | โรง 3 | Hollowcore slab warehouse counting |
| **STAFF** | สมพร ทรัพย์ประเสริฐ | `somporn@concretefactory.co.th` | `Demo1234!` **(DEMO ONLY)** | โรง 4 | L-Wall & pipe warehouse counting |

> **IMPORTANT**: The password `Demo1234!` is **DEMO ONLY**. Never reuse demo credentials in a real employee production environment.

### Demo Environment & Portfolio Notice
The public Vercel deployment is a portfolio demonstration environment (`DEMO_MODE=true`).

Demo users, stock quantities, warehouse locations, employee names, and operational records are sample/demo data. Do not reuse demo credentials for a real production deployment.

For an internal employee deployment, set `DEMO_MODE=false`, remove demo credentials, and provision authorized employee accounts.

> **หมายเหตุสภาพแวดล้อมสาธิต (Portfolio Demonstration)**:  
> ระบบที่ Deploy บน Vercel สาธารณะนี้ถูกจัดทำขึ้นเพื่อแสดงผลงานสถาปัตยกรรมระบบ (Portfolio Demonstration) โดยเปิดใช้งาน `DEMO_MODE=true` ข้อมูลบัญชีพนักงาน, จุดวางคลัง, ยอดสต๊อก และบันทึกการตรวจนับทั้งหมดเป็นข้อมูลจำลองสำหรับทดสอบฟังก์ชันการทำงาน ห้ามนำรหัสผ่านตัวอย่างไปใช้กับระบบ Production จริง หากต้องการนำระบบไปติดตั้งใช้งานสำหรับพนักงานจริง ให้กำหนดค่า `DEMO_MODE=false` และสร้างบัญชีผู้ใช้งานที่ได้รับอนุญาตอย่างเป็นทางการ

### Company Data Disclaimer
Company name and publicly available company profile information may originate from public sources of Khon Kaen Concrete Product Co., Ltd. (KCON).

Internal stock, SKU, employee, storage position and operational records shown in the demo are demonstration data unless imported from an authorized company data source.

> **ข้อจำกัดความรับผิดชอบข้อมูลองค์กร**:  
> ข้อมูลชื่อบริษัทและประวัติองค์กรที่แสดงบางส่วนอ้างอิงจากข้อมูลสาธารณะที่ตรวจสอบได้ของบริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด (KCON) ข้อมูลสต๊อกภายใน, รายการ SKU, รหัสพนักงาน และจุดวางคลังที่แสดงในระบบเป็นข้อมูลจำลองเพื่อการทดสอบระบบ เว้นแต่จะมีการนำเข้าจากแหล่งข้อมูลที่ได้รับอนุญาตขององค์กร

### Demo Mode Environment Separation
The system supports dual-mode deployment using strict environment variables:
- **Portfolio Demonstration**: `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true` (enables User Switcher and demo login).
- **Internal Production Deployment**: `DEMO_MODE=false` and `NEXT_PUBLIC_DEMO_MODE=false` (completely hides Demo Switcher, enforces server-side 403 Forbidden rejection on demo login actions, and disables automated demo user seeding).

---

## 7. Featured Demo Product (`FP-250-18`)

- **SKU**: `FP-250-18`
- **Product**: เสารั้วคอนกรีตอัดแรง
- **Dimensions**: สูง 2.50 ม. • หน้า 18 นิ้ว (Height: 2.50 M, Width: 18 INCH)
- **Plant**: โรง 2 (เสารั้ว/เสาไอ)
- **Unit**: ต้น
- **Current System Stock**: 118 ต้น
- **Master Storage Locations**:
  - `ล็อค A3 / แถว 6`: 40 ต้น
  - `ล็อค B3 / แถว 2`: 20 ต้น
  - `ล็อค B5 / แถว 1`: 58 ต้น
- **Test Count**:
  - 40 + 20 + 60 = 120 ต้น (ผลต่าง +2 ต้น)

---

## 8. Getting Started & Installation

### Prerequisites
- Node.js 18.18+ or 20+
- npm or pnpm

### 1. Clone the repository
```bash
git clone https://github.com/nthkmbm43/concrete-stock-count.git
cd concrete-stock-count
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` using `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your Neon PostgreSQL connection string and secret:
```env
DATABASE_URL="postgresql://user:password@ep-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="your_32_character_secret_key_here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Database Migrations & Seed
```bash
# Generate SQL migrations
npm run db:generate

# Push migrations directly to Neon database
npm run db:push

# Seed demo plants, products, locations, and users
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on desktop or mobile.

---

## 5. Realtime & Performance Architecture

The application adopts an enterprise-grade live query and zero-refresh architecture:

```mermaid
flowchart TD
    subgraph ClientA["User A (Admin/Staff)"]
        A_UI["Mobile UI (Optimistic <100ms)"]
        A_RT["Neon Realtime Provider"]
    end

    subgraph Server["Next.js Server Actions & SSR"]
        SSR["Server Component (Zero Skeleton on load)"]
        DAL["Centralized Data Access Layer (src/db/queries)"]
        SA["Atomic Domain Actions (src/actions)"]
        SEAL["Sealed Query Issuer (@neon/realtime/server)"]
    end

    subgraph Database["Neon PostgreSQL & Realtime"]
        PG[("PostgreSQL ACID Transaction")]
        LIVE["Neon Realtime WebSocket Proxy"]
    end

    subgraph ClientB["User B (Floor Staff)"]
        B_UI["Mobile UI (Instant Live Update)"]
        B_RT["Live Query Subscription (useLiveQuery)"]
    end

    A_UI -- "1. Action (<100ms UI Update)" --> SA
    SA -- "2. BEGIN ... COMMIT" --> PG
    PG -- "3. Logical Replication / Live Event" --> LIVE
    LIVE -- "4. Instant Push" --> B_RT
    B_RT -- "5. Re-render tanpa Refresh" --> B_UI
    SSR --> DAL --> PG
    SEAL --> B_RT
```

### Key Performance Pillars:
1. **Zero Full-Page Skeleton on Load**: Initial page load uses Server Components (`src/app/page.tsx`) with parallel `Promise.all` queries and request deduplication via `React.cache()`.
2. **Neon Realtime Live Queries**: Official SDKs (`@neon/realtime`, `@neon/realtime-react`, `@neon/realtime-drizzle`) with server-side query sealing and client `useLiveQuery`.
3. **Cross-Tab & Cross-Device Instant Sync**: Mutations broadcast instantly to all tabs via `BroadcastChannel` with fallback sync.
4. **Optimistic UI with Transaction Rollback**: Local UI responds under 100ms; if server transaction fails, state rolls back automatically.
5. **No N+1 Queries**: Efficient joins, selective column projection, database-level aggregates for count round progress (`COUNT`, `SUM`, `FILTER`), and indexed search fields.
6. **Search Debounce**: All product and history searches debounced at 300ms to eliminate query thrashing.

---

## 6. Reporting & Document Export Module (Excel • PDF • Print)

The system provides a dedicated enterprise reporting engine designed for plant managers, auditors, and inventory supervisors. All documents are generated on demand from live Neon PostgreSQL data without impacting live mobile stock counts.

```mermaid
flowchart LR
    subgraph Client["Export Modal (UI)"]
        Filter["Filter & Scope: Round / Plant / Diff Only"]
        BtnXls["ดาวน์โหลด Excel (.xlsx)"]
        BtnPdf["ดาวน์โหลด PDF (.pdf)"]
        BtnPrn["พิมพ์เอกสาร A4 (Print)"]
    end

    subgraph Server["Next.js Route Handlers & DAL"]
        Q["src/db/queries/reports.ts\n(getReportData - No N+1)"]
        XlsGen["src/lib/export/excel-generator.ts\n(ExcelJS Multi-Sheet Workbook)"]
        PdfGen["src/lib/export/pdf-generator.ts\n(jsPDF + AutoTable A4 Landscape)"]
        PrnView["src/app/reports/print/page.tsx\n(@media print A4 Landscape View)"]
    end

    subgraph Output["Export Deliverables"]
        XLS[".xlsx Corporate Workbook\n(Summary + Plants 1-4 + Diff Sheet)"]
        PDF[".pdf Multi-Page Vector Document"]
        HARD["Paper / PDF Printout\n(High-Contrast B&W Friendly)"]
    end

    Filter --> BtnXls & BtnPdf & BtnPrn
    BtnXls -->|GET /api/export/excel| Q --> XlsGen --> XLS
    BtnPdf -->|GET /api/export/pdf| Q --> PdfGen --> PDF
    BtnPrn -->|/reports/print| Q --> PrnView --> HARD
```

### Supported Export Capabilities

| Feature | Excel Export (`.xlsx`) | PDF Export (`.pdf`) | Print View (`/reports/print`) |
|---|---|---|---|
| **Engine** | `exceljs` Server-side | `jspdf` + `jspdf-autotable` | Server Component + Browser Native Engine |
| **Page Layout** | A4 Landscape, 1 page wide | A4 Landscape (297mm × 210mm) | `@page { size: A4 landscape; margin: 8mm; }` |
| **Sheets / Pagination** | Multi-sheet (Summary + Plants 1-4 + Diff) | Multi-page (`หน้า X จาก Y`) | Repeated `thead` on page breaks |
| **Multi-Location Rows** | Repeated SKU on each yard slot (Excel filter friendly) | Detailed Lock/Row/Status breakdown | Detailed Lock/Row/Status breakdown |
| **Discrepancy Colors** | Green fill (`#DCFCE7`), Red fill (`#FEE2E2`) | Green (`#166534`), Red (`#991B1B`) | Explicit sign (`+5`, `-2`, `0`) for B&W print |
| **Interactive Features** | Freeze panes (row 7), Auto-filter (`A7:P7`) | Compact audit table with notes | Interactive toolbar with Print & Download buttons |
| **Signature Block** | 3-party signatures (Checker, Supervisor, Approver) | Formally drawn signature block on last page | Formal 3-column signature block at document end |

---

## 8. Data Import Center & Unified KCON Branding

### Data Import Wizard (`/admin/import`)
A comprehensive 7-step data onboarding workflow engineered for warehouse data bulk upload:
1. **Import Type**: Products Master & Opening Stock.
2. **File Upload**: Drag & Drop `.xlsx`, `.xls`, or `.csv` (up to 10MB) with standard downloadable Excel template (`/api/import/template`).
3. **Sheet Selection**: Multi-sheet workbook navigation.
4. **Data Preview**: First 50 rows interactive tabular preview.
5. **Column Mapping with Auto-Detection**: Matches Excel headers against Thai and English canonical aliases (SKU, Name, Plant 1-4, Unit, Quantity, Variant, Lock, Row, Zone, Dimensions, Status).
6. **Validation & Duplicate Policy**:
   - **Multi-Location Aggregation**: Automatically aggregates repeated SKU rows across different storage locks/rows into one product entity with multiple locations and summed stock.
   - **Duplicate SKU Policy**: Choose between **Skip** (default), **Update** (with stock adjustment audit log), or **Create Only**.
   - **Error Handling**: Row-level validation and downloadable Excel Error Report with formula injection protection.
7. **Execution & Batch Audit Log**: Atomic database transaction writing to `import_batches` (`IMP-YYYYMMDD-XXX`) with full audit history.

### KCON Company Profile & Unified Branding
- **Single Source of Truth**: `company_settings` table storing verified public company information for **Khon Kaen Concrete Product Co., Ltd. (KCON)**.
- **Unified Brand Assets**: Dynamic `CompanyLogo` component rendering either custom uploaded logos or modern geometric concrete brand typography.
- **Consistent Reports & Exports**: Company branding, address, and contact details are automatically embedded into:
  - App Top Navigation Bar & Mobile Shell
  - Excel Export (`.xlsx`) Cover & Detail Headers
  - PDF Export (`.pdf`) Document Headers
  - A4 Landscape Print View (`/reports/print`)

---

## 9. Deployment & Live URLs

- **Production URL**: [https://store-app2.vercel.app](https://store-app2.vercel.app)
- **GitHub Repository**: [https://github.com/nthkmbm43/concrete-stock-count](https://github.com/nthkmbm43/concrete-stock-count)
- **GitHub Release (v1.0.1)**: [https://github.com/nthkmbm43/concrete-stock-count/releases/tag/v1.0.1](https://github.com/nthkmbm43/concrete-stock-count/releases/tag/v1.0.1)
- **Database**: Neon Serverless PostgreSQL (`ep-fragrant-feather-at378ccb.c-9.us-east-1.aws.neon.tech`)

### Automated Test Suites
Run all security, demo separation, and data import automated tests:
```bash
# Run complete test suite (52 Security & Demo Separation + 51 Import tests = 103 passed)
npm test

# Run security hardening tests only (Session Revocation, RBAC, 401/403, Zero Spoofing, Demo Mode Guard)
npm run test:security

# Run data import & branding tests only (Excel, CSV, Normalization, KCON)
npm run test:import
```

---

## 10. Tech Stack Summary

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/) (Strictly no emojis in UI)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`
- **Authentication**: [Better Auth](https://better-auth.com/)
- **State & Caching**: [TanStack Query v5](https://tanstack.com/query) + React 19 State
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Typography**: Noto Sans Thai

---

## 11. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
