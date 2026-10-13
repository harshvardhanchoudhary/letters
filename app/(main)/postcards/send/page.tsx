/* eslint-disable @next/next/no-img-element -- Local photo preview. */
"use client";
import { useState, useEffect } from "react";
import { uploadPhoto } from "@/app/actions/postcards";
import { PageHeading } from "@/components/PageHeading";
export default function SendPhoto() {
  const [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <div className="reading-page">
      <PageHeading
        number="02 / PHOTO"
        title="Keep this day."
        description="A photo, a few words, a little piece of your story."
      />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            const result = await uploadPhoto(new FormData(e.currentTarget));
            if (result?.error) {
              setError(result.error);
              setBusy(false);
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("NEXT_REDIRECT"))
              throw e;
            setError("Your photo could not be saved. Please try again.");
            setBusy(false);
          }
        }}
      >
        <label htmlFor="photo">
          Choose a photo (JPEG, PNG or WebP, up to 8 MB)
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : "");
          }}
        />
        {preview && (
          <img
            className="memory-photo"
            src={preview}
            alt="Your selected photo"
            style={{ margin: "25px 0" }}
          />
        )}
        <label htmlFor="caption" style={{ marginTop: 25 }}>
          What do you want to remember?
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={3}
          maxLength={2000}
          placeholder="The long way home. The best kind of afternoon."
        />
        <p className="subtitle" style={{ fontSize: 14 }}>
          Shared only within your journal. Location metadata is removed from new
          uploads.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions" style={{ marginTop: 24 }}>
          <span className="eyebrow">A MEMORY FOR THE TWO OF YOU</span>
          <button className="button" disabled={busy}>
            {busy ? "Keeping your memory…" : "Add to our story ↗"}
          </button>
        </div>
      </form>
    </div>
  );
}
