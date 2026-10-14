"use client";
import { useState, Suspense } from "react";
import { signIn } from "@/app/actions/auth";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function LoginForm() {
  const [email, setEmail] = useState(""),
    [loading, setLoading] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const params = useSearchParams();
  return (
    <div className="login-page">
      <section className="login-art">
        <Link href="/" className="wordmark">
          letters<span className="wordmark-dot">.</span>
        </Link>
        <div className="login-art-lines" />
        <div>
          <h2>
            Azizah & Harsh.
            <br />
            <em>There’s always a P.S.</em>
          </h2>
          <p className="eyebrow">THE LETTERS. THE TANGENTS. THE NEXT TIME.</p>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form">
          <p className="eyebrow">OUR ONGOING CORRESPONDENCE</p>
          <h1>{sent ? "Check your inbox." : "Oh, hello you."}</h1>
          <p className="subtitle">
            {sent
              ? "Your sign-in link is on its way. Open it in this browser to return to your journal."
              : "For the long version, the afterthought, and the thing you meant to send."}
          </p>
          {!sent && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (loading) return;
                setLoading(true);
                setError("");
                try {
                  const result = await signIn(email);
                  if (result.error) setError(result.error);
                  else setSent(true);
                } catch {
                  setError("We couldn’t send your link. Please try again.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label htmlFor="email">Your email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              {(error || params.has("error")) && (
                <p role="alert" className="error">
                  {error ||
                    (params.get("error") === "not_invited"
                      ? "This space is by invitation only."
                      : "That link has expired. Request a new one here.")}
                </p>
              )}
              <button className="button" disabled={loading}>
                {loading ? "Sending your link…" : "Send me a sign-in link ↗"}
              </button>
              <p className="eyebrow" style={{ textAlign: "center" }}>
                NO PASSWORD. JUST YOUR INBOX.
              </p>
            </form>
          )}
          {sent && (
            <button className="text-link" onClick={() => setSent(false)}>
              Use another email ↗
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
