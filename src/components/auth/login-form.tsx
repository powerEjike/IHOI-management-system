"use client";
import { useHydrated } from "@/lib/use-hydrated";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  getMultiFactorResolver,
  multiFactor,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
} from "firebase/auth";
import { getBrowserAuth } from "@/lib/firebase/client";

export function LoginForm() {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reset, setReset] = useState(false);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function establishSession() {
    const auth = await getBrowserAuth();
    if (!auth.currentUser) throw new Error("Sign in again to continue.");
    const response = await fetch("/api/auth/session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: await auth.currentUser.getIdToken(true),
      }),
    });
    const result = (await response.json()) as { code: string };
    if (response.ok) {
      await signOut(auth);
      window.location.assign("/portal/dashboard");
      return;
    }
    if (result.code === "mfa_required") {
      setNeedsEnrollment(true);
      setMessage("Add an authenticator app before continuing.");
      return;
    }
    if (result.code === "unverified") {
      setNeedsVerification(true);
      setMessage(
        "Verify your email before signing in to the leadership portal.",
      );
      return;
    }
    await signOut(auth);
    throw new Error(
      result.code === "unapproved"
        ? "Leadership access has not been approved. Contact the Super Admin."
        : result.code === "not_configured"
          ? "Staff access is awaiting server configuration."
          : "We could not start a secure session. Please sign in again or contact the administrator.",
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const auth = await getBrowserAuth();
      if (reset) {
        try {
          await sendPasswordResetEmail(
            auth,
            String(form.get("email") || "").trim(),
          );
        } catch {
          /* Same response to avoid account enumeration. */
        }
        setMessage(
          "If this account is eligible, Firebase will send password-reset instructions. Check your inbox and spam folder.",
        );
      } else if (resolver) {
        const factor = resolver.hints.find(
          (item) => item.factorId === TotpMultiFactorGenerator.FACTOR_ID,
        );
        if (!factor)
          throw new Error(
            "This account needs administrator assistance with its second factor.",
          );
        await resolver.resolveSignIn(
          TotpMultiFactorGenerator.assertionForSignIn(
            factor.uid,
            String(form.get("code") || ""),
          ),
        );
        await establishSession();
      } else if (secret) {
        if (!auth.currentUser) throw new Error("Sign in again to continue.");
        await multiFactor(auth.currentUser).enroll(
          TotpMultiFactorGenerator.assertionForEnrollment(
            secret,
            String(form.get("code") || ""),
          ),
          "IHOI authenticator",
        );
        await establishSession();
      } else {
        await signInWithEmailAndPassword(
          auth,
          String(form.get("email") || "").trim(),
          String(form.get("password") || ""),
        );
        await establishSession();
      }
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/multi-factor-auth-required"
      ) {
        setResolver(
          getMultiFactorResolver(
            await getBrowserAuth(),
            error as MultiFactorError,
          ),
        );
        setMessage("Enter the six-digit code from your authenticator app.");
      } else if (error instanceof FirebaseError) {
        setMessage(
          resolver || secret
            ? "The code could not be verified. Try the current code, or contact the administrator."
            : "Sign-in was unsuccessful. Check your details and try again. Repeated attempts may be temporarily limited.",
        );
      } else
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to continue. Please try again.",
        );
    } finally {
      setBusy(false);
    }
  }

  async function enroll() {
    setBusy(true);
    setMessage("");
    try {
      const auth = await getBrowserAuth();
      if (!auth.currentUser) throw new Error("Sign in again to continue.");
      if (!auth.currentUser.emailVerified) {
        setNeedsVerification(true);
        setMessage("Verify your email first, then sign in again.");
        return;
      }
      setSecret(
        await TotpMultiFactorGenerator.generateSecret(
          await multiFactor(auth.currentUser).getSession(),
        ),
      );
      setNeedsEnrollment(false);
    } catch {
      setMessage(
        "Authenticator setup is unavailable. Ask the administrator to enable TOTP MFA in Firebase Authentication with Identity Platform.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail() {
    setBusy(true);
    try {
      const auth = await getBrowserAuth();
      if (!auth.currentUser) throw new Error();
      await sendEmailVerification(auth.currentUser);
      setMessage(
        "Verification instructions sent. After verifying your email, restart sign-in.",
      );
    } catch {
      setMessage(
        "Unable to send verification instructions right now. Please try again later.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    await signOut(await getBrowserAuth());
    setResolver(null);
    setSecret(null);
    setNeedsEnrollment(false);
    setNeedsVerification(false);
    setMessage("");
    setReset(false);
  }

  return (
    <div className="auth-form-wrap">
      <form method="post" onSubmit={submit} className="auth-form">
        {resolver || secret ? (
          <>
            {secret ? (
              <div className="mfa-secret">
                <strong>Add IHOI to your authenticator app</strong>
                <p>
                  Choose “enter a setup key” in your app and use this key. Keep
                  it private.
                </p>
                <code>{secret.secretKey}</code>
              </div>
            ) : null}
            <label htmlFor="auth-code">Authenticator code</label>
            <input
              disabled={busy || !hydrated}
              id="auth-code"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
            />
          </>
        ) : needsEnrollment || needsVerification ? null : (
          <>
            <label htmlFor="auth-email">Leadership email</label>
            <input
              disabled={busy || !hydrated}
              id="auth-email"
              name="email"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
            />
            {!reset ? (
              <>
                <label htmlFor="auth-password">Password</label>
                <input
                  disabled={busy || !hydrated}
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={4096}
                  required
                />
              </>
            ) : null}
          </>
        )}
        {message ? (
          <p className="auth-message" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
        {!needsEnrollment && !needsVerification ? (
          <button className="button" disabled={busy || !hydrated} type="submit">
            {busy
              ? "Please wait…"
              : resolver || secret
                ? "Verify and continue"
                : reset
                  ? "Request password reset"
                  : "Sign in securely"}
          </button>
        ) : null}
      </form>
      {needsEnrollment ? (
        <button
          className="button"
          type="button"
          disabled={busy || !hydrated}
          onClick={enroll}
        >
          Set up authenticator
        </button>
      ) : null}
      {needsVerification ? (
        <button
          className="button"
          type="button"
          disabled={busy || !hydrated}
          onClick={verifyEmail}
        >
          Send verification email
        </button>
      ) : null}
      <div className="auth-actions">
        {resolver || secret || needsEnrollment || needsVerification ? (
          <button type="button" disabled={busy || !hydrated} onClick={restart}>
            Restart sign-in
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !hydrated}
            onClick={() => {
              setReset(!reset);
              setMessage("");
            }}
          >
            {reset ? "Back to sign-in" : "Forgot password?"}
          </button>
        )}
      </div>
      <p className="content-note">
        Portal access is reserved for Super Admin, President, and COO. President
        and COO signup requires an invitation.
      </p>
    </div>
  );
}
