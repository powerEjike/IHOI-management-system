# Leadership accounts and converts register

## Product decision

The public website and private administration portal remain one product. The portal is restricted to three individual account slots: Super Admin, President, and COO. The existing administrator retains Super Admin. President and COO have broad access to ministry operations and public-content administration; only Super Admin controls leadership invitations.

Workers, volunteers, converts, and disciples are records, never additional portal accounts. Marking someone as Worker does not grant a login.

## Leadership setup

1. Super Admin opens **Leadership accounts**.
2. Select President or COO, supply the leader's email and display name, and create an invitation.
3. Share the displayed code privately with that leader, together with the app's `/portal/join` address. The app does not send invitation emails automatically.
4. The leader chooses their own password, verifies their email, and completes setup using the invitation code.
5. The leader signs in and enrolls their own authenticator app.

Invitations expire after seven days. Creating another unused invitation replaces the previous code. Only a hash is stored. Email must match the invitation and be verified before claiming the slot. Acceptance is transactional and idempotent; occupied slots cannot be replaced through this flow.

Every private session checks both `staff_access/{uid}` and the matching fixed `leadership_accounts/{role}` slot. Valid Firebase credentials or an additional staff profile alone cannot grant access. The three leaders each have one role; combined or legacy staff roles are rejected. Account replacement/deactivation UI and configurable idle timeout remain later work.

## Converts workflow

- Manually register name, contact details, locality, registration date, stage, contact permission, private notes, and an optional leadership follow-up lead.
- A contact channel or an explicit no-contact-details explanation is required.
- Granted or declined permission needs a source and date. Unknown permission prompts review before contact; declined permission displays a do-not-contact notice.
- Future or invalid dates, excessive field lengths, unknown stages, unsupported assignments, and injected extra input fields are rejected server-side.
- Assignments can only target an active reserved leadership account. Other worker involvement will be recorded separately when personnel/follow-up modules are built.
- Search name/word, phone, or email prefixes using 2–80 characters. Search bodies are POSTed, keeping private terms out of URLs.
- Filter by ministry stage, leadership lead, current registration month, and active/archived status. Results use 25-record cursor pages.
- Review possible duplicates based on normalized email, phone, name order/accents, and approximate name prefixes. These are warnings, not guaranteed identity matches. A separate record requires an explanation of at least ten characters; there is no automatic merge.
- Edit with revision checks. Stale forms are rejected while client entries remain available. A stage change requires a reason.
- Archive or restore with a reason. History remains; there is no hard-delete UI.

Stable per-form request IDs make immediate repeated submissions idempotent. Record changes, related audit events, and assignment history commit atomically. Shared duplicate-key transaction locks prevent concurrent registrations from bypassing duplicate review. Audit metadata records changed field names and stage/permission transitions without copying complete contact details or notes.

The dashboard counts active records, active registrations this month, records without a follow-up lead, and active disciples. All figures are real database aggregates. They do not represent completed courses, unique outreach engagements, or scheduled contacts.

## Data and access

New server-only collections: `leadership_accounts`, `leadership_invitations`, `converts`, `convert_match_locks`, `assignment_history`; existing `staff_access` and `audit_logs` are reused. Direct browser Firestore access remains denied. Firebase Admin SDK bypasses Security Rules, so every server operation checks leadership access, and mutations recheck live approval inside transactions.

The committed index definitions cover dashboard date counts, register filter combinations, and audit-history ordering. The initially missing dashboard index was deployed; all required indexes reached READY and the exact failing aggregate query was verified successfully. A temporary preparing-view message handles index build periods without inventing zero totals.

## Verification

- All five production public-page browser tests pass, including navigation, protected-page redirects, and responsive layouts.
- All 54 unit/contract tests pass and cover leadership roster membership, MFA, invitation restrictions and hashing, input validation, same-origin/body limits, and required index definitions.
- Live Firebase/HTTP checks verified manual create, duplicate review, idempotent create/edit, stale revision rejection, combined filters, private details/history, archive/restore, and retained audit events.
- Live checks verified invited President self-registration with email verification and MFA, COO operational access, denial of COO invitation creation, and rejection of a fourth MFA-enabled account with a duplicate COO profile.
- Verification uses isolated fictional accounts and records only. They are removed afterward; real leadership slots and existing ministry records are never overwritten.
- Chrome browser checks passed registration, editing, archive/restore, search, COO navigation, mobile sign-out, and phone/tablet/desktop viewport fit, without browser runtime errors. The production build and TypeScript checks pass. Windows builds may use the existing opt-in generated-output preservation workaround; normal CI/deployment clean builds retain their default.

## Remaining release work

This is a working leadership/converts milestone, not the full product launch. Public website content editing and publication, outreach management, scheduled follow-up and reminders, discipleship courses, volunteer reviews, remaining reports, retention, and backup restoration remain on the roadmap. The private register does not publish convert identities or private notes to the website.
