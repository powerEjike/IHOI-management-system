# IHOI Ministry Website and Management Portal

## Working Product Requirements Document

**Ministry:** International House of Incense Ministries (IHOI)
**Version:** 1.3 — Three-account leadership baseline
**Date:** 6 November 2026
**Release:** Single-ministry responsive web application
**Status:** Ready to guide design and implementation; production content and account owners remain launch inputs.

## 1. Product purpose

Build one platform with a public ministry website and a secure staff portal. The website communicates IHOI’s mission and helps people discover outreaches, discipleship resources, projects, and opportunities to participate. The portal helps staff record outreach activity, manually register converts, coordinate follow-up, track discipleship, review volunteer applications, and maintain published content without coding.

The public website and portal share one database, with explicit separation between public content and private operational records. Approved operational information can populate public pages without duplicate entry.

This document consolidates the supplied IHOI PRD and the earlier church-management draft. IHOI’s ministry workflows take priority. ChurchCRM is a functional reference, not a required codebase, dependency, or implementation stack.

## 2. Goals and boundaries

### Goals

- Give IHOI a credible, accessible public website that staff can maintain.
- Establish a shared source of truth for outreach, converts, follow-up, and discipleship.
- Make responsibility for each follow-up clear and highlight overdue work.
- Publish accurate, approved aggregate impact figures without exposing personal records.
- Provide useful dashboards and exports with controlled access.
- Keep the initial product maintainable for a small ministry team.

### First-release scope

| Included | Delivery boundary |
|---|---|
| Public website and content management | Public pages, draft/publish controls, resources, projects, media, contact details |
| Staff authentication and permissions | Individual accounts, restricted roles, privileged-account MFA |
| Converts | Manual staff registration, search, duplicate checks, assignment, archive |
| Follow-up | Assignment, scheduled actions, contact history, overdue queue, in-portal reminders |
| Outreach | Planning, reports, aggregate metrics, publication |
| Discipleship | Courses, lessons, staff-managed enrolment and completion |
| Volunteers and workers | Applications, review, approval, training status, restricted safeguarding clearance |
| Public enquiries | Contact, partnership, volunteer forms and private staff review |
| Events | Basic public event listings; shared records with outreach where appropriate |
| Dashboard and reports | Role-specific summaries, date filters, CSV, print-friendly views |
| Administration | Ministry settings, account management, audit history, backup and recovery |

### Deferred

- General membership directories, family/household management, and service attendance.
- Tithes, offerings, donor ledgers, online payments, accounting, expenses, and payroll.
- Public member, convert, volunteer, or student login accounts.
- Multi-branch or multi-tenant operation.
- SMS, WhatsApp, bulk email campaigns, and email reminders.
- Public salvation-decision intake form; the first release uses manual convert registration only.
- Assessments, certificates, automated learning, and advanced report builders.
- Native mobile apps, biometric/QR check-in, AI features, and child pickup workflows.
- Historical convert imports; launch must not depend on obtaining a pre-existing convert database.

These features require an explicit scope change. General church-administration modules should not be added merely because ChurchCRM includes them.

## 3. Product decisions and assumptions

1. IHOI is one ministry with one shared operational database.
2. The interface language is English. Default timezone is Africa/Lagos; dates are stored consistently and displayed in the ministry timezone.
3. No financial transactions or contribution amounts are stored in v1. “Give” provides approved informational partnership instructions only.
4. Official convert records are created manually by authorized staff. Public enquiries never become converts automatically.
5. Initial convert assignment may be pending, but unassigned records must be visible to leadership as an action queue.
6. Follow-up reminders are delivered inside the portal. A scheduled server job creates reminder records even while nobody is browsing.
7. Staff must sign in to read reminders; v1 does not promise delivery outside the application.
8. Media uses recorded publication permission. Large videos/audio are externally hosted and embedded from supported providers.
9. Operational pages can launch with empty states. Public launch requires approved core ministry copy and contact information.
10. Development and preview environments use fictional data. Production begins without fabricated converts, testimonies, or impact metrics.

## 4. Users and authorization

The portal has exactly three reserved account slots: Super Admin, President, and COO. Each person has one individual account and one role. Workers, volunteers, converts, disciples, secretaries, and content contributors are records only and do not receive portal accounts.

| Role | Responsibilities | Account boundary |
|---|---|---|
| Super Admin | Full ministry operations, public content, publication, reports, audit access, and leadership invitations | Existing administrator; controls the reserved President and COO invitations |
| President | Broad administrative access to all ministry operations, website content, publication, reports, and oversight | Creates own account with a private invitation; one President slot |
| COO | Broad administrative access to all ministry operations, website content, publication, reports, and oversight | Creates own account with a private invitation; one COO slot |
| Public Visitor | Published content, resource downloads, and approved public submission forms | No portal access |

- All three leaders require verified email and authenticator-app MFA.
- A live server-managed roster binds each role to one Firebase UID. A staff profile alone does not grant access. A fourth account or duplicate role-holder is denied.
- The Super Admin issues a private, email-bound, seven-day invitation for President or COO. The invited leader chooses their own password, verifies email, and claims the slot. Codes are hashed at rest, consumed once, and never placed in URLs.
- President and COO have full operational/content access but cannot create additional portal accounts or grant roles.
- All three may review enquiries, approve volunteers, maintain records, publish content, and export permitted reports. Publication and sensitive actions remain audited.
- Workers perform ministry duties outside the application; leadership records their activity. A Worker ministry stage never creates a login.
- Follow-up identifies the responsible leadership account. Later worker-record assignment does not grant access.
- Database/storage rules and explicit server authorization enforce these boundaries. Hiding navigation is insufficient.
- Recheck roster membership, active approval, Firebase account status, and session revocation on private requests. Deactivation removes access on subsequent requests.
- Account replacement/recovery is a privileged audited process. The sole Super Admin must not lose administrative coverage accidentally.

## 5. Public website

### Navigation

Home; About; Outreach; Discipleship; Resources; Projects; Gallery; Partner With Us; Volunteer; Contact.

### Page requirements

| Page | Required behavior/content |
|---|---|
| Home | Editable hero, mission, pillars—Evangelize, Disciple, Empower, Transform—upcoming outreach, approved impact, featured resources/projects, partnership and volunteer calls to action |
| About | Approved history, vision, mission, leadership biographies and publication-cleared photographs |
| Outreach | Published upcoming/past activities, dates, public location, approved teams, reports, aggregate metrics, media; date/status filters |
| Discipleship | Published course catalogue and lesson overview; no student accounts or private progress |
| Resources | Sermons, studies, articles, books/materials; type/topic search and filtering; approved downloads and supported embeds |
| Projects | Description, upcoming/active/completed status, staff-entered progress, approved photos, partnership information |
| Gallery | Published albums, captions, cleared images and supported video embeds |
| Partner With Us | Pray/Give/Volunteer/Go information and private interest form; no payment processing |
| Volunteer | Role descriptions and application for contact details, interests, skills, availability, and adult-status declaration |
| Contact | Approved address, phone/email, ministry times, optional map, and contact form |

Basic non-outreach events appear in upcoming activities and relevant website sections. An event page is available by direct link; an additional top-level navigation item is unnecessary in v1.

### Content lifecycle

- Public content has draft, published, and archived states; published content may be unpublished to draft.
- Only published records and explicitly allowed fields are publicly accessible, including through APIs and file links.
- When published content is edited, staff explicitly save and republish; the prior published revision stays public until then.
- Staff previews require authentication. Drafts must not appear in search indexes or public sitemaps.
- Publishing operational records must never copy internal notes or identities into public fields automatically.
- The editor supports ordinary formatted text, links, images, and supported embeds. Arbitrary scripts/HTML are not accepted.
- Pages include readable titles, metadata, accessible image descriptions, and friendly not-found states.

### Public forms

- Forms collect only the information needed for their purpose and show a privacy notice.
- Volunteer and partnership forms record explicit permission to contact. Contact enquiries explain that details will be used to respond.
- All submissions enter a private queue. The response confirms receipt without exposing stored data or other applicants.
- Server-side validation, rate limits, a honeypot, and an abuse challenge when necessary protect forms.
- Staff can mark submissions new, in review, resolved, rejected, or spam, as relevant to the form.
- Attachments on public forms are excluded from v1.

## 6. Private management portal

### 6.1 Dashboard

Show role-appropriate live summaries with explicit date ranges:

- Upcoming outreaches and completed outreaches awaiting reports.
- Converts registered in the selected month.
- Unassigned converts, awaiting-first-contact cases, and overdue actions.
- Active disciples and completed course enrolments.
- Pending volunteer/partnership/contact submissions for authorized reviewers.
- Active projects and unread reminders.

All three leaders see operational summaries. Workers and contributors have no separate portal accounts. Every card links to its underlying filtered list. Empty states explain the next permitted action.

### 6.2 Converts

Leadership can create, edit, search, filter, assign, and archive converts.

| Field | Rule |
|---|---|
| Internal ID | System-generated, unique, immutable |
| Full name | Required; do not force a first-name/last-name format |
| Phone/email | Optional; at least one contact channel or a “no contact details available” reason |
| Location | Optional locality; exact address only when necessary for follow-up |
| Registration date | Defaults to today; cannot be in the future |
| Outreach | Optional link to an outreach record |
| Ministry stage | Convert, Disciple, or Worker; defaults to Convert |
| Contact permission | Granted, declined, or unknown, with recorded source/date when known |
| Follow-up lead | Optional Super Admin, President, or COO; changes recorded in assignment history |
| Notes | Private; collect only relevant information |

- Before creation, flag matching normalized phone/email and similar names. Staff can review a candidate or proceed with a documented reason; contact details need not be globally unique because households may share them.
- No automatic merging. Accidental duplicates can be archived with a link to the retained record and a reason.
- Contact permission of declined blocks outreach scheduling. Unknown permission requires review before contact; a permission-confirmation action can be recorded where appropriate.
- Follow-up history and discipleship are related records, not duplicate free-text fields.
- Authorized staff may correct ministry stage in either direction with a required reason and audit entry. Course completion does not change ministry stage automatically.
- Archive hides a convert from active lists and stops future reminders while retaining history. Restoring requires an authorized leader.

### 6.3 Follow-up and reminders

- Each convert has one current leadership follow-up lead and historical assignments. Worker involvement may be linked as a record without granting login access.
- A scheduled action has an owner, due date/time, type (call, visit, other), status (open, completed, cancelled), and optional private notes.
- A contact log has actual contact date/time, type, outcome (reached, no response, declined, other), notes, and optional next action.
- Leadership records contact logs and completes actions, including work carried out by ministry workers. Leadership can correct records; corrections retain an audit trail.
- A successful “reached” log resolves awaiting-first-contact; attempts with no response remain visible as awaiting first contact.
- “Overdue” means an open action whose due time has passed. A convert without an action is shown as unscheduled, not falsely treated as overdue.
- New registrations target first action within 48 hours by default. The portal proposes this date and allows an authorized override with a reason.
- A scheduled job runs at least hourly, creates due/overdue in-portal reminders, and escalates overdue cases to leadership after 48 hours. Intervals are configurable by administrators.
- Reminders have stable deduplication keys per action, recipient, and reminder type. Repeated or retried jobs do not create duplicates.
- Completion, cancellation, reassignment, archiving, and deactivation resolve or reroute outstanding reminders. Notification previews contain no private notes.
- Failed job runs are logged and visible to Super Admin. The next run can safely retry missed work.

### 6.4 Outreach and aggregate reporting

- Record title, start/end time, internal and public location, optional community identifier, internal team, public team label, status, report, metrics, and approved media.
- Activity status is planned, completed, or cancelled; publication status is separate.
- Metrics are non-negative integers. For completed activities, people engaged and decisions are required; an unknown value is allowed only with a reason and is excluded from numerical totals.
- Decisions cannot exceed people engaged when both are known.
- Upcoming outreach can be published without final metrics. Only validated metrics from completed, published, non-archived outreaches contribute to public impact.
- One outreach record supplies its public page, calendar appearance, and operational report. Do not create a second event to represent the same outreach.
- Public field previews show exactly what will be published.

### 6.5 Discipleship

- Staff create courses, ordered lessons, descriptions, and resource links; publication controls the public catalogue.
- Leadership enrol converts and assign a responsible worker.
- Leadership records lesson completion and worker involvement without providing worker logins.
- Enrolment status is active, completed, or withdrawn. The system marks completion when all required lessons are complete and records completion date.
- Course versions are fixed for existing enrolments. Adding/removing required lessons creates a new version for future enrolments, preserving historical completion.
- Completed enrolments and lesson corrections are auditable. A disciple may take multiple courses.
- Ministry stage and learning progress remain separate. An authorized person decides when to mark a convert as Disciple or Worker.

### 6.6 Volunteers and workers

- Applications collect full name, contact, interests, skills, availability, adult-status declaration, and contact permission.
- Applications progress through new, in review, approved, rejected, or withdrawn.
- Administrators can assign review tasks, record a decision and reason, and create/link an approved worker record without duplicate entry.
- Worker status is pending training, active, or inactive. Record training completion separately from application approval.
- Applicants under 18 remain in review pending an approved safeguarding process; they cannot be activated into unsupervised roles in v1.
- Roles involving unsupervised contact with minors require a reference/background-check clearance before activation. Store status, reviewer, date, and an external reference only; do not upload full background-check reports in v1.
- Only the three leadership accounts may view restricted clearance details. Public visitors and workers have no access.
- Worker activation never grants a portal account or login permissions.

### 6.7 Content, projects, and events

- Maintain website content, resources, albums, testimonies, projects, and basic events through forms.
- Projects have upcoming/active/completed/cancelled status and a manually entered progress percentage from 0–100. Progress is editorial and is not a calculated financial measure.
- Events have title, date/time, venue, description, organizer, poster, activity status, and publication status.
- Record media permission status, source, date, permitted use, and withdrawal where applicable. Identifiable people require publication permission; minors require guardian permission.
- Pending or withdrawn media cannot be published. Withdrawal removes public references and triggers removal of public files and cache invalidation; copies already downloaded cannot be recalled.
- Resource permissions/copyright ownership must be recorded before downloads are published.
- External embeds use approved providers. Private evidence and internal documents use private storage.

### 6.8 Settings and account administration

- Edit ministry name, logo, brand colors, contact details, ministry times, social links, homepage selections, and approved privacy/terms copy.
- The Super Admin invites the President and COO to their reserved slots. Require MFA for all three leaders, support password recovery, and manage deactivation without allowing extra accounts.
- Prevent deactivation or demotion of the final active Super Admin.
- Deactivation revokes sessions and access; pending assignments are flagged for reassignment.
- Privileged roles cannot be self-granted through profile updates or client requests.

## 7. Metric definitions and reports

### Public impact

| Label | Definition |
|---|---|
| Communities reached | Distinct approved community IDs on completed, published outreaches within the displayed period; equivalent place names are normalized by staff |
| People engaged | Sum of validated outreach engagement counts in the period; label as engagements, not unique people |
| Reported decisions for Christ | Sum of validated decisions from those outreaches; never add registered convert counts |
| Disciples receiving follow-up | Distinct active, non-archived convert records at Disciple stage with at least one completed contact in the displayed period; aggregate count only |

Public figures display a date range and last-updated time. Zero, unavailable, and unknown are distinct. Never invent figures to fill a layout. Public discipleship counts require an explicit publication setting enabled by leadership; they are hidden by default.

### Private reports

- Outreach activity and validated reported metrics by date/community.
- Converts by registration date, ministry stage, and assigned worker.
- Follow-up actions due, overdue, completed, and awaiting first contact.
- Course enrolments/completions and active disciples.
- Volunteer application outcomes and worker training status.

Every date-filtered report states which date is used. Use registration date for new converts, activity date for outreach, due date for open-action reports, actual contact date for contact activity, and completion date for course completions. Caseload and stage totals are explicitly “as of now” in v1; do not imply historical snapshots.

CSV exports follow the same permissions and filters as the screen. Private exports are available only to Super Admin, President, and COO. Workers and volunteers have no portal or export access. Exports are audited and protect spreadsheet users against formula injection. Print-friendly views are included; generated PDF reports are deferred.

## 8. Core workflows

1. **Convert:** authorized staff checks duplicates → manually creates record → assigns worker → schedules first action → worker logs contact → staff tracks discipleship.
2. **Follow-up reassignment:** leadership changes the responsible lead → actions transfer with an audit entry → reminders reroute; no worker login is granted.
3. **Outreach:** staff drafts activity → authorized publisher releases upcoming listing → staff completes report and metrics → publisher validates and republishes → eligible impact counters update.
4. **Volunteer:** visitor applies → private review → clearance where required → approval → training → active worker record; no portal account is created.
5. **Content:** editor prepares draft and permission evidence → publisher reviews preview → publishes → website updates; unpublishing removes public access.
6. **Enquiry:** visitor submits → private queue → administrator reviews and assigns response responsibility → staff records outcome → resolves submission. The system does not send messages automatically.

## 9. Data and architecture

### Recommended implementation

- Next.js App Router and TypeScript; Tailwind CSS and accessible reusable UI components.
- Firebase Authentication, Cloud Firestore, and Cloud Storage for Firebase. The Firebase project, database edition, and location are confirmed during setup; no billing upgrade is implicit.
- Confirmed setup: project `ihoi-management-system`, Firestore Standard native mode, `(default)` database in Johannesburg (`africa-south1`), with the available free tier. Storage and paid hosting/schedulers are not provisioned by this stage.
- One modular application with public routes, protected portal routes, and server-side services.
- Compatible managed hosting, with a scheduler capable of hourly authenticated jobs.
- GitHub source control, versioned Firestore/Storage rules and index definitions, and explicit data migration scripts when needed.
- Vitest for business-rule tests and Playwright for critical workflows and permission checks.
- Separate development, staging, and production configuration and data.

The hosting provider may change without altering product requirements. Infrastructure must support the chosen runtime, scheduled jobs, authentication, private storage, backups, and restore targets. Do not provision paid services without the required account authorization.

### Core records

`staff_access`, `profiles`, `converts`, `assignment_history`, `follow_up_actions`, `contact_logs`, `notifications`, `outreaches`, `communities`, `outreach_team_members`, `courses`, `course_versions`, `lessons`, `enrolments`, `lesson_progress`, `volunteer_applications`, `workers`, `worker_clearances`, `resources`, `projects`, `events`, `gallery_albums`, `media_assets`, `testimonies`, `partnership_submissions`, `contact_submissions`, `content_revisions`, `website_pages` (with private revisions and operation receipts), `published_pages` (approved public projections), `site_settings`, `website_records` (draft catalogue/settings records and revisions), `website_public` (approved projections), `website_submissions`, `website_form_limits`, `audit_logs`, `job_runs`.

- Use bounded document schemas, explicit IDs/references, transactional relationship checks, and indexes for common searches and assignment/date queries. Firestore does not enforce SQL foreign keys.
- Public projections/responses contain only approved fields; private notes and public content use separate documents. Firestore rules apply to whole documents, not individual fields.
- The initial portal uses a server-only data boundary: direct browser Firestore reads/writes are denied. Firebase Admin SDK bypasses rules, so every server data operation must check the session, live staff approval, role, and assignment scope explicitly.
- Store live active status and roles in server-managed `staff_access/{uid}` records. Never accept role assignments from browser input or editable profile metadata.
- Private storage requires authorized access or short-lived links. Public storage contains approved publication assets only.
- Service credentials remain server-side. Browser clients never receive privileged database secrets.
- Archiving preserves relationships. Hard deletion follows the retention process, not ordinary record editing.

## 10. Security, retention, and recovery

- Enforce permissions on every server operation and through database/storage policies. Test direct access attempts using real role-scoped sessions.
- Require MFA for privileged roles before they can use production operational functions.
- Use Firebase TOTP MFA with Identity Platform when enabled and authorized. If unavailable, privileged sessions remain blocked; do not silently reduce this requirement. Setup/cost implications must be reviewed before enabling the service.
- Use HTTPS, secure session handling, sign-in throttling, password recovery, and idle-session expiry with advance warning for unsaved forms.
- Validate inputs on the server; sanitize rich text and restrict uploads by actual type and size. Default image limit: 10 MB; published document limit: 25 MB. Executable content is rejected.
- Keep private personal information out of URLs, analytics events, error messages, public media metadata, and routine application logs.
- Audit role changes, assignment changes, ministry-stage changes, contact-permission changes, corrections, archiving, publication, clearance decisions, and exports. Record actor, timestamp, action, affected record, reason where required, and relevant old/new values without copying whole sensitive notes.
- Audit entries are append-only for normal users. Access is limited to the three leadership accounts.

### Proposed operational retention defaults

These are product defaults for leadership review before production, not a determination of legal retention obligations.

| Record | Default handling |
|---|---|
| Spam submissions | Delete after 30 days |
| Resolved contact/partnership submissions | Review for deletion or anonymization after 12 months |
| Rejected/withdrawn volunteer applications | Review after 12 months |
| Active converts and workers | Retain while ministry use remains current; annual review |
| Archived personal records | Review after 24 months for deletion/anonymization |
| Audit history | Retain for 24 months, minimizing personal details |
| Daily backups | Retain for at least 30 days, subject to provider capability |

Due retention reviews appear in an administrator queue. Deletion is a privileged, confirmed operation with a recorded reason; preserve non-identifying aggregate records where appropriate. Backups expire on their own schedule. After a restore, reapply recorded erasure actions before reopening the service.

Production requires approved privacy/consent wording and review of applicable local data-protection and safeguarding obligations. This PRD does not claim legal compliance by itself.

### Recovery

- Back up the database and uploaded assets daily, or use an equivalent managed recovery mechanism.
- Recovery point target: no more than 24 hours of data loss. Recovery time target: restore service within one business day.
- Demonstrate database and media restoration into an isolated environment before launch.
- Document ownership, restore steps, secret rotation, incident contact, and scheduler recovery.
- Monitor availability, application failures, and scheduled-job failures without logging sensitive case content.

## 11. Experience and quality requirements

- Responsive layouts for phone, tablet, and desktop; no horizontal scrolling for ordinary form workflows.
- Aim for WCAG 2.2 AA: keyboard operation, visible focus, proper labels, accessible errors, contrast, and alternative text.
- Search, filters, pagination, and clear empty states for operational lists.
- Preserve form inputs on recoverable errors; identify failed saves and offer retry.
- Prevent duplicate submissions and duplicate side effects on retries.
- Warn before abandoning unsaved edits. Detect stale concurrent edits and ask the user to reload/review instead of silently overwriting another user’s changes.
- Show success states only after the server confirms persistence.
- A failed embed must leave useful text/link content. Empty public sections are hidden or show accurate approved placeholders.

### Pilot targets

| Measure | Acceptance target |
|---|---|
| Capacity | 5,000 converts, 20 concurrent staff, and 50,000 contact/action records |
| Common portal list/search | 95% complete within 2 seconds under agreed staging load, excluding file transfer and client network latency |
| Core public pages | Main content becomes usable within 3 seconds on the agreed representative mobile connection/device |
| Manual convert registration | A trained user completes a normal record in under 2 minutes |
| Follow-up logging | A trained worker records a normal contact in under 1 minute |
| Reminder job | Runs at least hourly; missed work is processed on a successful retry without duplicates |
| Reporting | Screen, dashboard, and export totals reconcile for identical definitions/filters |

## 12. Release acceptance checklist

The release is ready for a controlled production pilot when all mandatory checks pass:

1. All public routes work on mobile and desktop and expose only published content and allowed fields.
2. Authorized editors can manage website content; only authorized publishers can publish it.
3. Public users cannot read private submissions, converts, follow-up, or private storage through any supported access path.
4. Only the reserved Super Admin, President, and COO may enter the portal. Other Firebase users and duplicate-role profiles are denied through pages and APIs; direct browser database access remains denied.
5. Reassignment and deactivation remove prior access and resolve/reroute outstanding actions/reminders correctly.
6. Official converts are created only by authorized manual staff actions. Duplicate warnings and archive behavior work.
7. Contact restrictions, stage corrections, and permission changes are enforced and audited.
8. Contact logs, action completion, overdue calculation, and hourly reminders work while browsers are closed; repeat jobs do not duplicate reminders.
9. Outreach metrics meet validation rules and public counters follow the definitions in this document, including unknown values and unpublishing.
10. Course enrolment, version preservation, lesson progress, and completion work without public student accounts.
11. Volunteer approval, training, clearance restrictions, and account separation work.
12. Contact, partnership, and volunteer submissions are private, validated, rate limited, and reviewable.
13. Media permission restrictions and withdrawal behavior work; draft/private assets cannot be accessed publicly.
14. Reports and protected CSV exports match source records and permitted filters.
15. Privileged users have MFA; the final Super Admin cannot accidentally remove their own administrative coverage.
16. Failed saves, repeated submissions, and concurrent edits do not silently lose or duplicate records.
17. Agreed accessibility, responsive, and performance checks pass for the core workflows.
18. Backup/restore is demonstrated; production ownership and operational instructions are documented.
19. No fictional impact claims or sample personal records remain in production.

## 13. Implementation stages

| Stage | Deliverable | Exit condition |
|---|---|---|
| 1. Foundation | Design system, schema, migrations, authentication, role policies, storage separation | Permission baseline verified before real private data is collected |
| 2. Public presence | Public pages, CMS, revisions, publication, media, private enquiry queues | Staff can publish approved content without code; drafts/private forms remain protected |
| 3. Core ministry operations | Converts, assignments, follow-up, outreach, reminder scheduler | Complete registration-to-follow-up workflow and tested public metric publication |
| 4. Discipleship and volunteers | Courses, progress, applications, worker training/clearance | Staff can manage enrolment and safely activate eligible workers |
| 5. Pilot and launch | Dashboard, reports, exports, recovery drill, accessibility/security/workflow checks, staff training | Release checklist passes and launch inputs are approved |

Build and preview incrementally using fictional data. Do not publicly enable submission forms until private storage/access controls are verified. Dates and cost estimates are established after design and environment setup; this document does not promise a fixed delivery schedule.

## 14. Launch inputs and ownership

Development can proceed with placeholders and empty states. Production launch requires:

- Confirmation of ministry name, logo, colors, approved mission/history, leadership profiles, and contact/ministry times.
- Initial approved resources, project descriptions, and media, or agreement to hide empty sections.
- Named Super Admin, President, and COO, with content ownership and backup/incident responsibilities allocated among them.
- Agreed follow-up hours, capacity, training, and worker eligibility rules.
- Approved privacy notices, contact-permission wording, media releases, and retention policy.
- Confirmed domain, hosting accounts, service budgets, and production access.

No historical convert database is required. No unapproved personal information should be supplied merely to make the initial application look populated.

## 15. Scope control and future releases

This version is the implementation baseline. Routine interface and technical choices can be made within these requirements. Changes to data exposure, official registration rules, role permissions, paid integrations, or release scope require an explicit recorded product decision.

Likely later additions are service attendance, members/families, a reviewed salvation-intake workflow, external reminders, optional certificates, and online giving. Their priority should follow pilot evidence rather than expanding the first release.
