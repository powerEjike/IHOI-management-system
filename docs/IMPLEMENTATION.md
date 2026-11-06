# Implementation roadmap

## Working method

1. Implement one bounded stage locally.
2. Run relevant checks and document material limitations.
3. Commit reviewed files only.
4. Give the repository owner the exact PowerShell push command.
5. Verify deployed behavior after deployment is configured.

Do not automatically push or deploy. Keep working code and project documentation synchronized. Do not register this repository with a website-generation service.

## Stage 0 — Product baseline

- [x] Consolidate the IHOI requirements into `docs/PRD.md`.
- [x] Establish the local Git repository and GitHub remote.
- [x] Record development order and manual publishing workflow.

## Stage 1 — Application foundation

- [x] Scaffold Next.js App Router with TypeScript and Tailwind.
- [x] Add public and portal layout boundaries and a responsive design system.
- [x] Add environment-variable examples with placeholders and validation.
- [x] Configure type checking, configuration tests, and build verification.
- [x] Implement public preview pages with honest empty states and draft-content notices.
- [x] Clearly mark staff authentication as unavailable until connected.
- [ ] Complete interactive browser/visual QA; local Edge startup is currently failing before page interaction.

Exit: the application builds, the public shell renders, and configuration is documented.

## Stage 2 — Identity and database security

- Configure the authorized Supabase project and versioned migrations.
- Implement sign-in, invitation/recovery flow, roles, MFA enforcement, and deactivation.
- Establish server checks, row-level security, private/public storage separation, and audit logging.
- Test access as public, worker, coordinator, editor, and administrator users.

Exit: unauthorized access is denied through both server and database paths. No real private submissions are collected before this stage passes.

## Stage 3 — Website and content operations

- Implement public pages, resource browsing, projects, gallery, and basic events.
- Add content editing, revisions, preview, publication, and media permissions.
- Implement private contact, partnership, and volunteer queues with form abuse protection.

Exit: staff can publish approved content without code and drafts/private records stay private.

## Stage 4 — Ministry operations

- Implement manual convert registration, duplicate warnings, assignment, and archiving.
- Add follow-up actions, contact logs, reassignment, and hourly in-portal reminders.
- Add outreach reports and precisely defined publication metrics.

Exit: registration through follow-up works with assignment restrictions and idempotent scheduled jobs.

## Stage 5 — Discipleship and volunteers

- Add versioned courses, lessons, enrolment, and staff-managed progress.
- Complete application review, clearance restrictions, training, and worker activation.

Exit: course history is preserved and approval never grants a staff account automatically.

## Stage 6 — Pilot readiness

- Complete dashboards, reports, protected CSV exports, and operational settings.
- Verify accessibility, performance, permissions, retries, and concurrent edits.
- Demonstrate database/media backup restoration.
- Replace or hide unapproved public content; remove development data.
- Confirm domain, budgets, content owners, privacy wording, and operational ownership.

Exit: all mandatory PRD acceptance criteria pass before production use.
