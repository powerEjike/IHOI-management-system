"use client";
import { useState } from "react";
export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div>
      <button
        className="button button-outline"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            const result = await fetch("/api/auth/session", {
              method: "DELETE",
              credentials: "same-origin",
            });
            if (!result.ok) throw new Error();
            window.location.assign("/portal/login");
          } catch {
            setFailed(true);
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {failed ? <p role="alert">Sign-out failed. Please try again.</p> : null}
    </div>
  );
}
