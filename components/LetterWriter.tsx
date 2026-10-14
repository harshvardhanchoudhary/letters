"use client";
import { useState, useEffect } from "react";
import { saveDraft } from "@/app/actions/journal";
import { sendLetter } from "@/app/actions/letters";
import { wordCount } from "@/lib/journal-tools";
import { PageHeading } from "./PageHeading";
export function LetterWriter({
  draft,
  partnerName,
}: {
  partnerName: string;
  draft: { id: string; subject: string; body: string };
}) {
  const [body, setBody] = useState(draft.body),
    [subject, setSubject] = useState(draft.subject),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [preview, setPreview] = useState(false),
    [focus, setFocus] = useState(false),
    [saved, setSaved] = useState({ body: draft.body, subject: draft.subject });
  const dirty = body !== saved.body || subject !== saved.subject;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function append(line: string) {
    setBody((current) =>
      `${current}${current.trim() ? "\n\n" : ""}${line}`.slice(0, 100000),
    );
    setConfirm(false);
    setPreview(false);
    setMessage("Unsaved changes");
    requestAnimationFrame(() =>
      document.getElementById("letter-body")?.focus(),
    );
  }
  function form() {
    const f = new FormData();
    f.set("id", draft.id);
    f.set("body", body);
    f.set("subject", subject);
    return f;
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await saveDraft(form());
      if (result.error) setError(result.error);
      else {
        setSaved({ body, subject });
        setMessage("Draft saved privately. You can return to it later.");
      }
    } catch {
      setError("Draft not saved. Keep this page open and try again.");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    setBusy(true);
    setError("");
    try {
      const result = await sendLetter(form());
      if (result?.error) {
        setError(result.error);
        setBusy(false);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
      setError("Could not send. Your letter is still here.");
      setBusy(false);
    }
  }
  return (
    <div
      className={`reading-page writing-room ${focus ? "writing-room-focused" : ""}`}
    >
      <PageHeading
        number="01 / WRITE"
        title={`Dear ${partnerName},`}
        description={`Tell ${partnerName} the long version. Tangents welcome.`}
      />
      <div className="reading-controls">
        <button
          className="text-link"
          onClick={() => setFocus(!focus)}
          aria-pressed={focus}
        >
          {focus ? "Leave writing room ↙" : "Just me and this letter ↗"}
        </button>
        <button
          className="text-link"
          onClick={() => setPreview(!preview)}
          aria-pressed={preview}
        >
          {preview ? "Back to writing" : "Read before sealing"}
        </button>
      </div>
      <details className="writing-prompts">
        <summary className="text-link">A nudge for the blank page +</summary>
        <p>Choose an opening to add at the end. Your words stay untouched.</p>
        <div className="chips">
          {[
            "The thing I forgot to tell you…",
            "An entirely unnecessary update:",
            "I keep thinking about…",
            "P.S. One more thing.",
          ].map((line) => (
            <button key={line} onClick={() => append(line)} disabled={busy}>
              {line}
            </button>
          ))}
        </div>
      </details>
      {preview && (
        <article className="personal-letter letter-preview">
          <p className="eyebrow">PRIVATE PREVIEW · NOT SENT</p>
          <h2>{subject || `Dear ${partnerName},`}</h2>
          <div className="letter-body">
            {body || "Your words will appear here as you write."}
          </div>
        </article>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirm(true);
        }}
      >
        <div hidden={preview}>
          <label htmlFor="subject">A title, if you like</label>
          <input
            id="subject"
            className="subject-input"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setMessage("Unsaved changes");
              setConfirm(false);
            }}
            maxLength={250}
            placeholder="An important tangent"
          />
          <label htmlFor="letter-body" style={{ marginTop: 28 }}>
            Your letter
          </label>
          <textarea
            id="letter-body"
            className="composition"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setMessage("Unsaved changes");
              setConfirm(false);
            }}
            placeholder={`Dearest ${partnerName},`}
            maxLength={100000}
            required
            rows={12}
          />
        </div>
        <div className="form-actions">
          <span className="eyebrow">
            {wordCount(body)} WORDS · {dirty ? "UNSAVED" : "SAVED DRAFT"}
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <button
              type="button"
              className="text-link"
              onClick={save}
              disabled={busy}
            >
              Save draft
            </button>
            <button className="button" disabled={busy || !body.trim()}>
              Seal & send ↗
            </button>
          </div>
        </div>
        {message && (
          <p className="status" role="status" style={{ marginTop: 16 }}>
            {message}
          </p>
        )}
        {error && (
          <p className="error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
        {confirm && (
          <div className="side-note" style={{ paddingTop: 24 }}>
            <h3>Ready to seal this letter?</h3>
            <p style={{ margin: "12px 0" }}>
              Once sent, this letter cannot be edited or deleted. Give it one
              last read.
            </p>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="button"
            >
              {busy ? "Sealing…" : "Yes, send my letter"}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="text-link"
              style={{ marginLeft: 20 }}
            >
              Keep writing
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
