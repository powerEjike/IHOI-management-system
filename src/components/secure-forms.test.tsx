import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, refresh() {} }),
}));
import { RecordEditor } from "./website/record-editor";
import { EnquiryForm } from "./website/enquiry-form";
import { MediaLibrary } from "./website/media-library";
import { ReviewEnquiry } from "./website/inbox";
import { newFields } from "@/lib/website/schema";
import { PageEditor } from "./website/page-editor";
import { LoginForm } from "./auth/login-form";
import { JoinForm } from "./leadership/join-form";
import { InviteForm } from "./leadership/invite-form";
import { ConvertForm } from "./converts/convert-form";
import { ConvertList } from "./converts/convert-list";
it.each([
  ["public enquiry", () => <EnquiryForm kind="contact" />],
  ["media upload", () => <MediaLibrary media={[]} />],
  [
    "enquiry review",
    () => <ReviewEnquiry id={"a".repeat(64)} status="new" revision={1} />,
  ],
  [
    "catalogue editor",
    () => (
      <RecordEditor
        record={{
          id: "a".repeat(32),
          kind: "leaders",
          version: 0,
          status: "draft",
          publishedVersion: null,
          draft: newFields("leaders"),
          media: [],
        }}
        history={[]}
        media={[]}
      />
    ),
  ],
  [
    "website draft",
    () => (
      <PageEditor
        data={{
          slug: "about",
          version: 0,
          draft: {
            title: "Title",
            description: "Summary",
            heading: "Heading",
            body: "Body",
          },
          publishedVersion: null,
          status: "draft",
          history: [],
        }}
      />
    ),
  ],
  ["login", () => <LoginForm />],
  ["leadership signup", () => <JoinForm />],
  ["invitation", () => <InviteForm />],
  [
    "convert registration",
    () => <ConvertForm requestId="00000000-0000-0000-0000-000000000000" />,
  ],
  [
    "private search",
    () => (
      <ConvertList
        initial={{ records: [], nextCursor: null }}
        initialFilters={{
          q: "",
          stage: "all",
          lead: "all",
          archived: false,
          recent: false,
        }}
      />
    ),
  ],
] as const)(
  "%s uses POST and prevents entry before hydration",
  (_name, component) => {
    const html = renderToStaticMarkup(component());
    expect(html).toMatch(/<form[^>]*method="post"/);
    expect(html).not.toMatch(/method="get"/);
    expect(html).toContain('disabled=""');
  },
);
