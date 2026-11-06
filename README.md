# IHOI Management System

Public ministry website and private management portal for International House of Incense.

## Product baseline

Read [the working PRD](docs/PRD.md) for scope, roles, workflows, data rules, and release acceptance criteria. Read [the implementation roadmap](docs/IMPLEMENTATION.md) for development order.

The first release focuses on outreach, manually registered converts, follow-up, discipleship, volunteers, and staff-managed public content. It excludes payments, accounting, service attendance, and general membership management.

## Development approach

This is a source-controlled application developed locally in small, reviewable stages. Each stage is implemented and checked before being committed. The repository owner manually pushes commits and handles deployment/account setup with guidance.

Implemented stack: Next.js App Router, TypeScript, Tailwind CSS, Vitest, and Playwright. Supabase PostgreSQL/Auth/Storage is planned for the identity stage. Hosting is selected during environment setup. No hosted site or deployment has been provisioned.

## Current status

The public application foundation is implemented: responsive homepage, ministry page shells, partnership pathways, privacy/status page, and a separate staff-access holding page. All ministry text/branding is a draft. Content listings use honest empty states. No impact figures, staff authentication, live forms, or database records are simulated.

## Run locally

Use Node.js 24 LTS and npm. From the repository folder:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. No environment file or cloud account is required for the foundation. Optionally copy `.env.example` to `.env.local` and set the canonical HTTP(S) origin. Do not include a path or secrets in `NEXT_PUBLIC_SITE_URL`.

## Verification

```powershell
npm run check
npm run test:e2e
```

`check` runs type checking, unit tests, and a production build. Browser tests start their own production server on port 3100, so run a build first and leave that port free. On Windows the tests use installed Microsoft Edge. Elsewhere run `npx playwright install chromium` once. Set `PLAYWRIGHT_CHANNEL` if another supported installed channel is needed.

The initial environment passed compilation, nine configuration tests, and HTTP checks for all public routes, missing pages, and response headers. Interactive browser checks were blocked by the local Edge process exiting during startup; mobile menu behavior, visual appearance, and viewport fit still need a successful browser run. See `docs/FOUNDATION-VERIFICATION.md`.

## Preview and launch boundary

Public routes: `/`, `/about`, `/outreach`, `/discipleship`, `/resources`, `/projects`, `/gallery`, `/partner`, `/volunteer`, `/contact`, and `/privacy`. `/portal` is only an unavailable-access notice, not an authenticated dashboard. Unknown portal subpaths return 404.

Search indexing is disabled using page metadata and `robots.txt` while content is unapproved. These controls are not authentication. Before production launch, connect authentication/database policies, approve copy and identity, implement the CMS, verify forms and access rules, and deliberately revisit indexing.

Never commit secrets, real convert records, private submissions, or safeguarding documents. Local examples must use fictional data.
