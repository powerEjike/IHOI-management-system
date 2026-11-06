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
- [x] Complete interactive Chrome browser QA, mobile navigation and responsive public/private layouts.

Exit: the application builds, the public shell renders, and configuration is documented.

## Stage 2 — Identity and database security

- [x] Create the dedicated Firebase project and Standard Firestore database in Johannesburg.
- [x] Enable Firebase email/password authentication and save local web configuration.
- [x] Implement sign-in/recovery, verified-email checks, TOTP enrollment/challenge, and server sessions.
- [x] Add live staff approval/role checks, fail-closed browser database rules, and a first-admin bootstrap script.
- [x] Verify the local server runtime credential.
- [x] Create the intended first administrator and verify privileged MFA access with a temporary account.
- [x] First administrator completed email verification and authenticator enrollment.
- [x] Restrict portal access to the reserved Super Admin, President, and COO accounts.
- [x] Add Super Admin invitation UI and email-bound, verified self-registration for President/COO.
- [ ] Implement account replacement/deactivation controls and configurable idle timeout.
- [x] Complete live role/MFA/session tests with a temporary account and remove its Auth/staff records.

Exit: unauthorized access is denied through both server and database paths. No real private submissions are collected before this stage passes.

## Stage 3 — Website and content operations

- Implement public pages, resource browsing, projects, gallery, and basic events.
- [x] Add section-page text editing, private previews, revisions/restoration, explicit publication, unpublish/archive, and audit history.
- [ ] Extend editing to rich content, homepage, catalogues, and media permissions.
- Implement private contact, partnership, and volunteer queues with form abuse protection.

Exit: staff can publish approved content without code and drafts/private records stay private.

## Stage 4 — Ministry operations

- [x] Implement manual convert registration, search/filter pagination, duplicate warnings, leadership assignment, editing, archive/restore, and audit history.
- [x] Add real convert dashboard figures and required Firestore indexes.
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
