# IHOI Management System

Public ministry website and private management portal for International House of Incense.

## Product baseline

Read [the working PRD](docs/PRD.md) for scope, roles, workflows, data rules, and release acceptance criteria. Read [the implementation roadmap](docs/IMPLEMENTATION.md) for development order.

The first release focuses on outreach, manually registered converts, follow-up, discipleship, volunteers, and staff-managed public content. It excludes payments, accounting, service attendance, and general membership management.

## Development approach

This is a source-controlled application developed locally in small, reviewable stages. Each stage is implemented and checked before being committed. The repository owner manually pushes commits and handles deployment/account setup with guidance.

Planned stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/Storage, Vitest, and Playwright. Hosting is selected during environment setup. No hosted site or deployment has been provisioned.

## Current status

Planning foundation committed. Application scaffolding and database implementation have not started. No runnable application is included yet.

Never commit secrets, real convert records, private submissions, or safeguarding documents. Local examples must use fictional data.
