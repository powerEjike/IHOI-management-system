# Vercel hosting

Deployment is authorized by the user's explicit hosting request. This supersedes the earlier no-deployment development boundary; Git pushes remain manual.

- Team: power-ejikes-projects (team_BrISst7OCG8iLNDR4D6ae6i9).
- Project: ihoi-management-system (prj_9GZggR6DSmYuEJeh1xBKY6BaPpV4).
- Node.js 24, Next.js/Webpack, Cape Town functions (cpt1), existing Johannesburg Firestore.
- Production website is public; preview deployments retain Vercel sign-in protection. No billing upgrade was requested or applied.

## Keyless Firebase access

Production uses Vercel OIDC with Google Workload Identity Federation. The private key remains on the local computer and is not included in deployment files or environment variables. The existing service account is impersonated through IAM Credentials; its Firebase permissions are unchanged.

The ihoi-vercel pool / vercel-production provider accepts only the configured Vercel issuer, team ID, IHOI project ID and production environment. The service-account IAM binding is limited to the exact IHOI production subject. Preview and development deployment identities are excluded.

Production variables: the four NEXT_PUBLIC_FIREBASE_* web identifiers; FIREBASE_PROJECT_ID, FIREBASE_DATABASE_ID, FIREBASE_ADMIN_ENABLED=true, FIREBASE_CREDENTIAL_MODE=vercel-oidc; GCP_PROJECT_NUMBER=598846934135, GCP_WORKLOAD_IDENTITY_POOL_ID=ihoi-vercel, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel-production, GCP_SERVICE_ACCOUNT_EMAIL=firebase-adminsdk-fbsvc@ihoi-management-system.iam.gserviceaccount.com. NEXT_PUBLIC_SITE_URL is the final stable HTTPS alias.

For local development, leave FIREBASE_CREDENTIAL_MODE unset and retain the existing GOOGLE_APPLICATION_CREDENTIALS path outside Git. Never copy that local path into Vercel.

## Forms and content

Forms stay closed until approved contact/privacy settings are published. Before opening forms, configure PUBLIC_FORM_RATE_LIMIT_SECRET as a sensitive production variable containing at least 32 cryptographically random characters, and PUBLIC_FORM_PROXY_HEADER=x-vercel-forwarded-for. The proxy header is accepted only behind Vercel's managed ingress. No public enquiries are enabled by deployment alone. Search indexing remains disabled while ministry content is pending.

Only source/configuration files and official public logo assets are uploaded. .env files, credentials, build output, caches and local verification records are excluded. Releases can be uploaded from a reviewed local commit without pushing Git automatically. The linked GitHub repository remains the source backup; pushing is controlled by the repository owner.

Runtime dependency review found an older transitive gRPC client. A compatible 1.14.7 override removes the production audit findings; development CLI advisories are separate from the deployed runtime. Deployment checks include TypeScript, tests, production build, public routes and authenticated Firebase operations.
