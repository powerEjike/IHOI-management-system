"use client";
import { useHydrated } from "@/lib/use-hydrated";
import { useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getBrowserAuth } from "@/lib/firebase/client";
import { postJson } from "@/lib/client-api";
export function JoinForm() {
  const hydrated = useHydrated();
  const [existing, setExisting] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const code = useRef("");
  async function complete() {
    setBusy(true);
    setMessage("");
    try {
      const auth = await getBrowserAuth();
      if (!auth.currentUser) throw new Error("Sign in again to finish setup.");
      await auth.currentUser.reload();
      await postJson("/api/leadership/accept", {
        idToken: await auth.currentUser.getIdToken(true),
        code: code.current,
      });
      await signOut(auth);
      window.location.assign("/portal/login");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to complete setup.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p>
        Account creation is by private invitation for the President and COO
        only.
      </p>
      {ready ? (
        <div className="auth-form">
          <p>
            Check your inbox and verify your email. Return here and select
            Complete setup. Then sign in to enroll your authenticator app.
          </p>
          <button
            className="button"
            type="button"
            disabled={busy || !hydrated}
            onClick={complete}
          >
            {busy ? "Checking…" : "Complete setup"}
          </button>
          <button
            type="button"
            className="text-link"
            disabled={busy || !hydrated}
            onClick={async () => {
              const auth = await getBrowserAuth();
              await signOut(auth);
              setReady(false);
              setMessage("");
            }}
          >
            Start again
          </button>
        </div>
      ) : (
        <form
          method="post"
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setMessage("");
            const form = new FormData(event.currentTarget);
            code.current = String(form.get("code") || "").trim();
            try {
              const auth = await getBrowserAuth();
              const credential = await (
                existing
                  ? signInWithEmailAndPassword
                  : createUserWithEmailAndPassword
              )(
                auth,
                String(form.get("email") || "").trim(),
                String(form.get("password") || ""),
              );
              if (!credential.user.emailVerified)
                await sendEmailVerification(credential.user);
              setReady(true);
            } catch {
              setMessage(
                "Account setup was unsuccessful. Check your details. If the account already exists, choose Use an existing account. Password recovery is available on the sign-in page.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="join-code">Invitation code</label>
          <input
            disabled={busy || !hydrated}
            id="join-code"
            name="code"
            required
            maxLength={60}
            autoComplete="off"
          />
          <label htmlFor="join-email">Invited email</label>
          <input
            disabled={busy || !hydrated}
            id="join-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="username"
          />
          <label htmlFor="join-password">
            {existing ? "Password" : "Choose a password"}
          </label>
          <input
            disabled={busy || !hydrated}
            id="join-password"
            name="password"
            type="password"
            required
            minLength={existing ? 1 : 12}
            maxLength={4096}
            autoComplete={existing ? "current-password" : "new-password"}
          />
          <button className="button" type="submit" disabled={busy || !hydrated}>
            {busy
              ? "Please wait…"
              : existing
                ? "Sign in to accept invitation"
                : "Create my account"}
          </button>
          <button
            type="button"
            className="text-link"
            disabled={busy || !hydrated}
            onClick={() => {
              setExisting(!existing);
              setMessage("");
            }}
          >
            {existing ? "Create a new account" : "Use an existing account"}
          </button>
        </form>
      )}
      {message ? (
        <p className="auth-message" role="status">
          {message}
        </p>
      ) : null}
    </>
  );
}
