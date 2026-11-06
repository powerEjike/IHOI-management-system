# Firebase setup and current boundary

> Current milestone: see [Leadership and converts verification](LEADERSHIP-AND-CONVERTS.md). The three-account leadership model and successful Chrome checks supersede earlier staff-role examples and browser limitations below.


## Project

- Firebase project: `ihoi-management-system`.
- Web app: `IHOI Website and Portal`.
- Firestore: Standard edition, native mode, database `(default)`, Johannesburg `africa-south1`.
- The database reports `freeTier: true`. No billing account, paid storage, Functions, or website hosting deployment was configured.
- Database deletion protection is enabled.
- Public SDK configuration is saved in ignored `.env.local`; copy the corresponding values into deployment settings when hosting is selected.
- The official ministry logo is the unmodified supplied image in `public/branding/ihoi-logo.png` and `src/app/icon.png`.

## Authentication design

The browser uses email/password sign-in with in-memory Firebase persistence. It sends a fresh ID token to a same-origin session endpoint. The server verifies token revocation, recent authentication, verified email, current Firebase account status, and the live `staff_access/{uid}` record before issuing an HttpOnly, same-site session cookie. Production cookies require HTTPS. The server repeats verification and staff approval checks on private requests; roles never come from editable browser metadata.

Privileged roles require TOTP MFA, and users who enrolled a factor must complete MFA on sign-in. TOTP must be enabled in Firebase Authentication with Identity Platform. Review the project's current limits and any upgrade terms before enabling it; no billing upgrade is authorized by this implementation. Privileged access stays blocked if MFA is unavailable.

TOTP is now enabled and its configuration was read back. Live enrollment and privileged-session issuance were verified using a temporary account, which was deleted afterward. Improved email privacy is enabled. The intended first Super Admin account and its approval/audit records exist; the account owner must set their password, verify email, and enroll their own authenticator before access.

This stage provides the staff access shell, not the full administration application. Staff invitation/role-management UI, idle-time session expiry, audited operational mutations, and real ministry modules remain later work. Current cookies have an absolute eight-hour lifetime; a sign-out clears this browser's server cookie. Account disablement, token revocation, and inactive staff approval are rechecked server-side.

## Server credentials

The Admin SDK needs Application Default Credentials. Use managed workload credentials on a compatible hosting runtime. For local development, a private service-account JSON may be stored outside the repository and referenced with `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local`. Never paste its contents into chat or commit it.

The Firebase CLI login and the Admin SDK runtime credential are separate. A working CLI login does not give this Next.js server an Admin SDK credential automatically.

The local runtime credential has been verified with a successful Firestore staff query. `.env.local` references the user-supplied key file outside the repository and has `FIREBASE_ADMIN_ENABLED=true`. No key material is stored in Git. Other computers/deployments need their own authorized credential configuration.

After the runtime credential is installed and tested, set `FIREBASE_ADMIN_ENABLED=true` in `.env.local` and restart the development server. Until then the login page displays a setup notice and does not collect credentials.

## First staff account

1. Create the intended administrator account in Firebase Authentication. Do not use a shared staff login.
2. With authorized server credentials available, run the local bootstrap script with that Auth user's UID:

```powershell
node scripts/bootstrap-admin.mjs --uid=AUTH_USER_UID --name="Administrator name"
```

The script refuses to overwrite an existing staff document or run when an active Super Admin already exists. It creates approval and an audit event atomically. It does not create accounts, send email, or mark email verified.

3. Sign in, verify email when prompted, then enroll the authenticator app. TOTP uses a manual setup key and six-digit verification code; the key is shown only during enrollment and must be kept private.
4. Verify successful sign-in, sign-out, revoked access, deactivation, and MFA rejection before admitting real operational data.

## Firestore access

All direct browser Firestore access is denied in this stage, including self-created role assignments and authenticated users. The server uses the Admin SDK, which bypasses Security Rules, so authorization must be explicit at every server data operation. Future public content is returned as a server-approved field projection; private documents must never be served wholesale.

Rules are a prototype boundary, not a complete production authorization system. The default-deny rules have no client write pathways, so create/update validators are not currently needed. Add bounded schema validators and permission tests before enabling any client writes.

## Verification completed

- 30 unit/contract tests cover configuration, staff approval, roles, MFA requirements, session revocation checks, same-origin protection, and cookie handling.
- TypeScript and the Webpack production build passed. The restricted Windows environment needed `IHOI_PRESERVE_BUILD_OUTPUT=true` for the build because recreating generated directories sometimes returns EPERM. Normal builds keep the clean-output default; do not enable this workaround for CI/deployment.
- Public and authenticated Firebase SDK reads were denied by deployed Firestore rules.
- A temporary verified worker signed in through Firebase, obtained a real server session, and rendered the protected workspace.
- Changing that worker to a privileged role immediately blocked the existing non-MFA session. Live TOTP enrollment then allowed a privileged session.
- Deactivation denied an existing privileged session on its next request; logout cleared the cookie.
- Temporary Auth and staff test records were deleted. No real ministry operations data was added.
- Interactive browser/visual QA is still pending because local headless Edge startup previously failed. SDK/server checks do not substitute for browser interaction tests.

## Manual deployment commands

From the repository, using the authenticated CLI:

```powershell
npx -y firebase-tools@latest deploy --only auth --project ihoi-management-system
npx -y firebase-tools@latest deploy --only firestore:rules --dry-run --project ihoi-management-system
npx -y firebase-tools@latest deploy --only firestore:rules --project ihoi-management-system
```

The local environment used the installed matching CLI directly after repeated `npx` cache extraction failures. Website publishing and GitHub pushes remain manual.
