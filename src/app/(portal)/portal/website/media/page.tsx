import { Workspace } from "@/components/portal/workspace";
import { requireStaff } from "@/lib/auth/session";
import { library } from "@/lib/website/media";
import { MediaLibrary } from "@/components/website/media-library";
export const dynamic = "force-dynamic";
export default async function MediaPage() {
  const staff = await requireStaff();
  return (
    <Workspace
      staff={staff}
      title="Media & permissions"
      eyebrow="Website library"
    >
      <MediaLibrary media={await library()} />
    </Workspace>
  );
}
