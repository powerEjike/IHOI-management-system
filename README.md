# IHOI Management System

Public ministry website and private management portal for International House of Incense.

## Product baseline

Read [the working PRD](docs/PRD.md) for scope, roles, workflows, data rules, and release acceptance criteria. Read [the implementation roadmap](docs/IMPLEMENTATION.md) for development order.

The first release focuses on outreach, manually registered converts, follow-up, discipleship, volunteers, and staff-managed public content. It excludes payments, accounting, service attendance, and general membership management.

## Development approach

This is a source-controlled application developed locally in small, reviewable stages. Each stage is implemented and checked before being committed. The repository owner manually pushes commits and handles deployment/account setup with guidance.

Implemented stack: Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Firebase Admin SDK, Cloud Firestore, Vitest, and Playwright. Firebase project `ihoi-management-system` uses Firestore Standard in Johannesburg. Website hosting is selected separately; no website deployment has been provisioned.

## Current status

The public application foundation and official ministry logo are implemented. Firebase staff access includes email/password authentication, verified email, TOTP enrollment/challenge, server session cookies, and live staff approval/role checks. Local runtime credentials and the first approved administrator are configured; the first administrator has verified email and enrolled TOTP. Content listings remain honest empty states; public submission forms and the remaining operational modules are pending.

The current portal has three reserved accounts only: Super Admin, President, and COO. The Super Admin can invite President/COO to create their own verified accounts. All three have access to the working converts register: create, duplicate review, search, filters, edit, leadership follow-up assignment, archive/restore, and audit history. Workers and volunteers do not receive logins. See [leadership and converts](docs/LEADERSHIP-AND-CONVERTS.md).

Website page text can now be edited, previewed privately, published, unpublished, archived, and restored through **Website content**. See [website publishing](docs/WEBSITE-CONTENT.md) for the current scope.

See [Firebase setup](docs/FIREBASE-SETUP.md) for the credential boundary, bootstrap process, and setup status. The public web identifiers belong in `.env.local`; Admin credentials must stay server-only and outside Git.

## Run locally

Use Node.js 24 LTS and npm. From the repository folder:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Public pages render without cloud credentials. Copy `.env.example` to `.env.local` and configure Firebase to enable staff access; keep `FIREBASE_ADMIN_ENABLED=false` until server setup is verified. Set the canonical HTTP(S) origin for deployed authentication. Do not include a path or secrets in `NEXT_PUBLIC_SITE_URL`.

## Verification

```powershell
npm run check
npm run test:e2e
```

`check` runs type checking, unit tests, and a production build. Browser tests start their own production server on port 3100, so run a build first and leave that port free. On Windows the tests use installed Google Chrome. Elsewhere run `npx playwright install chromium` once. Set `PLAYWRIGHT_CHANNEL` if another supported installed channel is needed.

The current milestone passes 61 unit/contract tests and live Firebase checks, including leadership invitations, access enforcement, converts, duplicate review, and audit history. Chrome browser checks passed registration, editing, archive/restore, search, responsive private layouts, mobile sign-out, and absence of runtime errors. See [current verification](docs/LEADERSHIP-AND-CONVERTS.md). Earlier foundation/browser limitations are historical.

Build/dev scripts use Webpack to avoid local Turbopack junction restrictions; normal clean builds remain the default. See `docs/FIREBASE-SETUP.md` for the optional restricted-Windows build workaround.

## Preview and launch boundary

Public routes: `/`, `/about`, `/outreach`, `/discipleship`, `/resources`, `/projects`, `/gallery`, `/partner`, `/volunteer`, `/contact`, and `/privacy`. `/portal` sends users to login or the protected `/portal/dashboard` leadership workspace. Login is enabled with configured Firebase credentials. Unknown portal subpaths return 404.

Search indexing is disabled using page metadata and `robots.txt` while content is unapproved. These controls are not authentication. Before production launch, connect authentication/database policies, approve copy and identity, implement the CMS, verify forms and access rules, and deliberately revisit indexing.

Never commit secrets, real convert records, private submissions, or safeguarding documents. Local examples must use fictional data.
