# Public website completion and content handoff

All 78 unit/contract tests and TypeScript checks pass. Browser verification covers all eight catalogue types, drafts and publication, homepage edits, photo upload/approval/withdrawal, public enquiries and private review, plus phone/tablet/desktop layouts. The production build and all five public-page Playwright tests pass (tested against an explicitly managed production server). The compiled application passed browser verification, including under-18 safeguarding review, draft 404s, actual browser photo decoding and media withdrawal. A final compiled-build check confirmed that withdrawn photo bytes, links and captions disappear from public responses.

The website is prioritized separately from the remaining ministry-operations roadmap. The public structure and editing tools are ready for ministry-supplied content; no invented history, biographies, photographs, events, or impact figures are seeded.

## What leadership can manage

- Homepage headline, introduction, and mission copy; partnership introduction; eight section-page introductions and body copy.
- Leader names, roles, biographies, and permission-cleared portraits.
- Resources with categories, formatted articles, external downloads/materials, and click-to-load YouTube videos.
- Projects with activity status, optional approved percentage progress, descriptions and photographs.
- Events with Lagos date/time, end time, venue, organizer, status and poster/photos. Published future gatherings appear on the homepage.
- Gallery albums with up to 12 optimized photos and accessible descriptions; outreach stories; course catalogue descriptions; and permission-approved testimonies.
- Public contact email, phone, address, gathering information, social links and privacy notice.
- Contact, partnership and volunteer enquiry forms, with a private leadership review queue.

The Website content desk is at /portal/website. All three leadership roles can manage content, media, settings and enquiries. Publication is explicit; editing a published item preserves its public version. Revisions, restoration, unpublish, archive, optimistic concurrency and idempotent writes are supported. The latest 20 revisions are available in the editor. Private catalogue lists show the latest 100 records. Public lists have title-prefix search and 12-record cursor pages.

## Content and permission workflow

1. Upload a still JPEG, PNG or WebP photo in Media & permissions. Inputs are limited to 2 MB / 16 megapixels; optimized WebP outputs are at most 200 KB and metadata is removed.
2. Record alt text, permission source/date and whether identifiable minors appear. Guardian consent is required for public images of identifiable minors. Pending images remain private and can be approved later.
3. Create page/catalogue drafts. Text supports paragraphs, bold, second-level headings, bullet lists and HTTPS links, without raw HTML.
4. Record leadership approval and its source/date before publishing catalogue content or settings. Testimonies and biographies must already have permission for the information being shared; the application does not infer consent.
5. Publish saved drafts after preview. Draft details return 404 publicly. Public projections exclude approval references, private notes, revisions and audit events.
6. Withdraw a photo's permission to stop serving that file, including where previously published. Previously downloaded copies cannot be recalled. Reuse after withdrawal requires a new upload and permission record.

Photos are held in private Firestore image_data subdocuments with lightweight metadata parents. Public lists/details filter withdrawn media metadata; image access requires both active permission and a reference from published content; direct browser database access remains denied. This bounded library uses the existing project and does not provision a paid Storage bucket. For a large library or higher traffic, migrate the binary adapter to object storage and set explicit budgets before launch. Audio, video and document files use external HTTPS links rather than Firestore binary uploads.

## Enquiries and launch configuration

Forms remain closed by default. To open them, publish settings containing a valid ministry email, approved privacy notice (at least 80 characters), recorded publication approval, and Forms enabled = yes. A server-only PUBLIC_FORM_RATE_LIMIT_SECRET of at least 32 characters is required. Local setup has a generated secret in ignored .env.local; never commit or paste it.

Production also requires PUBLIC_FORM_PROXY_HEADER to name a client-IP header that the hosting provider overwrites and protects from spoofing. Do not trust an arbitrary forwarded header on a server exposed directly to clients. Until the deployment's proxy boundary is verified, leave public forms closed. Rate limits are five submissions per visitor IP/hour and 60 total/hour; daily HMAC keys avoid storing raw IPs in application records. Honeypot, minimum completion time, consent, field limits and same-origin JSON checks are enforced server-side. These controls are abuse mitigation; add App Check/CAPTCHA or edge protection if observed traffic requires it.

Under-18 volunteer enquiries enter safeguarding review and cannot grant or activate a worker role. Enquiries are stored privately with their consent time and the published privacy version. Only leaders can review statuses (new, in progress, resolved, spam, archived). Submission does not grant a login, make someone a worker, enroll anyone in a course, send an email, or process a payment. Leadership replies using its existing channels. Retention and infrastructure logs must be covered by the approved privacy notice; automatic retention jobs and backup restoration remain pilot-readiness work.

## Content to supply after construction

- Approved ministry history, vision/mission and any beliefs statement.
- President and COO names, titles, biographies and approved portraits.
- Gallery photos grouped into albums, captions/alt descriptions, dates and permission details.
- Resource titles, introductions, authors/speakers where appropriate, and approved public links.
- Project descriptions/status/progress; event dates/times/locations and organizers.
- Outreach stories, course descriptions and testimonies cleared for publication.
- Ministry email, phone, location, gathering times and social links.
- Approved privacy wording and the person responsible for handling enquiries and privacy requests.

Final Firebase cleanup verification found zero temporary verification accounts, zero photo metadata records, zero enquiries, and no published website settings. Only the real Super Admin leadership slot remains reserved.

Actual content entry, domain/hosting deployment and launch approval follow this handoff. Search indexing remains disabled until the ministry content and launch configuration are approved. Remaining converts/follow-up, discipleship progress and worker administration are separate portal work.

Implementation references: [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Sharp output and metadata behavior](https://sharp.pixelplumbing.com/api-output/).
