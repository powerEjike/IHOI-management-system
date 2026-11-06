# Website page publishing

The leadership portal now includes **Website content** at `/portal/website`. Super Admin, President, and COO can edit the eight existing section pages: About, Outreach, Discipleship, Resources, Projects, Gallery, Volunteer, and Contact.

Each page has a title, summary/search description, section heading, and plain-text body with paragraph breaks. Save a draft, preview it privately, and explicitly publish the saved version. Draft updates and restored historical versions do not replace the live published copy. Unpublish returns the public route to its holding message. Archive also removes the public copy; saving or restoring reopens it as a draft. Routes remain available.

Concurrent stale edits are rejected without discarding local entries. Every successful action records an immutable revision and audit event atomically; the latest 20 revisions can be inspected and restored as a new draft. Repeated identical request IDs return the original result. Navigation warns about unsaved changes.

## Access and storage

`website_pages/{slug}` and its `revisions` and `operations` subcollections are private. `published_pages/{slug}` contains only an explicitly approved copy, version and publication timestamp. Public routes read only that projection via the server; browser Firestore rules remain deny-all. No new indexes or cloud services are needed.

Every API call requires a current leadership session, same-origin JSON, bounded input, and server validation. Transactions recheck live approval and the reserved leadership slot. Unknown routes, HTML, extra copy fields, oversized text, and stale versions are rejected. Public metadata follows the published version. No public API exposes revisions or audit details.

## Verified

All 61 unit/contract tests, TypeScript checking, and the production build pass. Service tests cover draft privacy, explicit publication, retained public versions during edits, archive/unpublish, revision restoration, idempotency, stale writes, guest/roster rejection, allowed public fields, and validation. Chrome with a temporary COO account verified the complete browser-to-API-to-Firestore flow, plus private preview, guest denial, and 390/768/1440px viewport fit. Fictional content and the temporary account were removed after testing. All five production public-page browser cases also passed; the local Windows runner stalled during server teardown and was stopped after the assertions completed.

## Remaining scope

This is the first content-editing milestone. Rich text, links, image/media permissions, embeds, homepage editing, resources/projects/events/gallery catalogue records, contact/partnership/volunteer forms, and submission queues remain planned. Search indexing remains disabled until launch approval. There is no automatic website deployment.
