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

## 6. Demo Accounts

For evaluation and testing, the application includes pre-seeded demo accounts:

| Role | Name | Email | Default Plant | Capabilities |
|---|---|---|---|---|
| **ADMIN** | ชัยวัฒน์ (หัวหน้าคลัง) | `admin@concretefactory.co.th` | โรง 1 | Full administrative rights (Product CRUD, Adjustments, Round control) |
| **STAFF** | สมชาย ใจมั่นคง | `somchai@concretefactory.co.th` | โรง 1 | Raw materials warehouse counting |
| **STAFF** | วิชัย สุวรรณโชติ | `wichai@concretefactory.co.th` | โรง 2 | Finished goods counting (featured post `FP-250-18`) |
| **STAFF** | นิตยา รักษ์พงษ์ | `nittaya@concretefactory.co.th` | โรง 3 | Hollowcore slab warehouse counting |
| **STAFF** | สมพร ทรัพย์ประเสริฐ | `somporn@concretefactory.co.th` | โรง 4 | L-Wall & pipe warehouse counting |

> **Note**: Tapping the user avatar in the top app bar opens the Demo Switcher, allowing one-click switching between accounts or registering a new `STAFF` account.

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
git clone https://github.com/your-username/concrete-stock-count.git
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

## 9. Deployment on Vercel

1. Push your repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **"New Project"**.
3. Import your `concrete-stock-count` repository.
4. Under **Environment Variables**, configure:
   - `DATABASE_URL`: Your Neon PostgreSQL Connection String (Singapore or nearest region)
   - `BETTER_AUTH_SECRET`: A secure 32+ character random string
   - `BETTER_AUTH_URL`: Your production Vercel URL (e.g. `https://concrete-stock-count.vercel.app`)
   - `NEXT_PUBLIC_APP_URL`: Your production Vercel URL
5. Click **Deploy**. Vercel will build and deploy the Next.js application automatically!

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
