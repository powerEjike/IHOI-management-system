"use client";
import { useHydrated } from "@/lib/use-hydrated";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";
export function InviteForm() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [invitation, setInvitation] = useState<{
    code: string;
    role: string;
  } | null>(null);
  return (
    <section className="workspace-panel">
      <h2>Invite a leader</h2>
      <p>
        The President and COO each create their own account using a private
        invitation code. Each role has one account slot.
      </p>
      <form
        method="post"
        className="record-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setError("");
          setInvitation(null);
          try {
            setInvitation(
              await postJson(
                "/api/leadership/invitations",
                Object.fromEntries(form),
              ),
            );
            router.refresh();
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to create invitation.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Leadership role
            <select disabled={busy || !hydrated} name="role" required>
              <option value="president">President</option>
              <option value="coo">COO</option>
            </select>
          </label>
          <label>
            Display name
            <input
              disabled={busy || !hydrated}
              name="displayName"
              required
              maxLength={120}
            />
          </label>
          <label className="form-wide">
            Email address
            <input
              disabled={busy || !hydrated}
              name="email"
              type="email"
              required
              maxLength={254}
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <button className="button" type="submit" disabled={busy || !hydrated}>
          {busy ? "Creating…" : "Create private invitation"}
        </button>
      </form>
      {invitation ? (
        <div className="invitation-result" role="status">
          <strong>
            Invitation for{" "}
            {invitation.role === "president" ? "the President" : "the COO"}
          </strong>
          <p>
            Share this code privately with the invited leader. It expires in
            seven days and is shown only now. Creating another invitation
            replaces the previous unused code.
          </p>
          <code>{invitation.code}</code>
          <p>
            The leader should open <a href="/portal/join">/portal/join</a>, use
            their invited email, verify it, and complete setup. No invitation
            email is sent automatically.
          </p>
        </div>
      ) : null}
    </section>
  );
}
