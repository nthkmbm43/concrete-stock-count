## Highlights

- **Mobile-First Stock Counting**: Engineered for floor workers and yard supervisors with touch-optimized controls and instant calculations.
- **Multi-Location Lock/Row Breakdown**: Count inventory across multiple physical slots (`ล็อค/แถว`) per SKU with live expected vs actual comparisons.
- **Master vs Observed Locations**: Clear separation between system-designated positions and newly discovered physical yard locations (`จุดวางใหม่`) with undo support.
- **Draft, Submit & Recount**: Real-time optimistic UI, local persistence, atomic PostgreSQL transactions, and immutable recount audit trails.
- **Cross-User Realtime Sync**: Zero manual page refresh; instant status updates across mobile tabs and devices.
- **Enterprise RBAC**: Role-based access control with `STAFF` and `ADMIN` separation.
- **Server-Side Authorization**: Full session verification via Better Auth and PostgreSQL database role authority (`profiles.role`) as single source of truth.
- **Zero Client Identity Spoofing**: Elimination of all client-controlled identity and permission parameters.
- **Database Architecture**: Serverless Neon PostgreSQL with Drizzle ORM and connection pooling.
- **Data Import Center (`/admin/import`)**: Bulk Excel (.xlsx) and CSV import wizard with automatic multi-location row aggregation and duplicate policies.
- **Corporate Reporting Engine**: On-demand multi-sheet Excel (.xlsx) export, multi-page PDF (.pdf) export, and high-contrast A4 Landscape Print view (`/reports/print`).
- **KCON Public Profile & Unified Branding**: Single source of truth for company metadata and SVG geometric branding across app headers and documents.
- **Production Deployment**: Hosted and continuous delivery on Vercel Production (`https://store-app2.vercel.app`).

## Security Hardening
- Server session verification (`requireSession()`, `requireUser()`).
- Strict administrative action guards (`requireAdmin()`, `requireStaffOrAdmin()`).
- Protected API routes (`/api/export/excel`, `/api/export/pdf`, `/api/import/template`).
- Complete eradication of fallback spoof identities.

## Testing & Verification
- 96/96 automated tests passed during v1.0.0 validation (45 Security + 51 Import tests).
- 0 TypeScript and Next.js build errors.
