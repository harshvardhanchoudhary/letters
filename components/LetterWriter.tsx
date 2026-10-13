"use client";
import { useState } from "react";
import { saveDraft } from "@/app/actions/journal";
import { sendLetter } from "@/app/actions/letters";
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
    [confirm, setConfirm] = useState(false);
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
      else setMessage("Draft saved privately. You can return to it later.");
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
    <div className="reading-page">
      <PageHeading
        number="01 / WRITE"
        title={`Dear ${partnerName},`}
        description={`A letter for ${partnerName}. Just your words, in your own time.`}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirm(true);
        }}
      >
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
          placeholder="For you, on this ordinary day"
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
          placeholder="My dear…"
          maxLength={100000}
          required
          rows={12}
        />
        <div className="form-actions">
          <span className="eyebrow">
            {body.trim().split(/\s+/).filter(Boolean).length} WORDS
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
              Once sent, your letter becomes part of your shared story.
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
