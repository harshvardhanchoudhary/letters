"use client";
import { useState } from "react";
import { addMoment } from "@/app/actions/moments";
import { PageHeading } from "@/components/PageHeading";
export default function AddMoment() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="reading-page">
      <PageHeading
        number="02 / MOMENT"
        title="Remember this."
        description="Some moments are too good to leave behind."
      />
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await addMoment(new FormData(e.currentTarget));
            if (result?.error) {
              setError(result.error);
              setBusy(false);
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("NEXT_REDIRECT"))
              throw e;
            setError("Your moment could not be saved. Please try again.");
            setBusy(false);
          }
        }}
      >
        <div className="wide">
          <label htmlFor="moment-title">A name for this moment</label>
          <input
            id="moment-title"
            name="title"
            required
            maxLength={250}
            placeholder="That Sunday with nowhere to be"
          />
        </div>
        <div className="wide">
          <label htmlFor="moment-note">The little details</label>
          <textarea id="moment-note" name="note" rows={5} maxLength={10000} />
        </div>
        <div>
          <label htmlFor="moment-date">When was it?</label>
          <input id="moment-date" name="occurred_at" type="date" required />
        </div>
        {error && (
          <p className="error wide" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions wide">
          <span className="eyebrow">PART OF YOUR STORY</span>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Keep this moment ↗"}
          </button>
        </div>
      </form>
    </div>
  );
}
