"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { markAsRead } from "@/app/actions/letters";
import { dateLabel } from "@/lib/validation";
export type LetterItem = {
  id: string;
  subject?: string | null;
  body: string;
  sent_at: string;
  read_at: string | null;
  from_id: string;
  to_id: string;
  from_profile?:
    | { display_name: string | null; email?: string | null }
    | { display_name: string | null; email?: string | null }[]
    | null;
};
export default function LettersListClient({
  letters,
  userId,
}: {
  letters: LetterItem[];
  userId: string;
}) {
  const [selected, setSelected] = useState<LetterItem | null>(null),
    [expanded, setExpanded] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = useMemo(
    () =>
      letters.filter(
        (l) =>
          (filter === "all" ||
            (filter === "received" && l.to_id === userId) ||
            (filter === "sent" && l.from_id === userId)) &&
          `${l.subject || ""} ${l.body}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [letters, query, filter, userId],
  );
  useEffect(() => {
    if (selected) {
      dialog.current?.showModal();
      if (selected.to_id === userId && !selected.read_at)
        void markAsRead(selected.id).catch(() => {});
    } else dialog.current?.close();
  }, [selected, userId]);
  function close() {
    setSelected(null);
    setExpanded(false);
  }
  return (
    <>
      <div className="archive-intro-strip">
        <div>
          <span className="eyebrow">THE WORDS THAT MADE US</span>
          <p>{letters.length} letters. A thousand ways to say it.</p>
        </div>
        <button
          className="button secondary"
          disabled={!letters.length}
          onClick={() =>
            setSelected(letters[Math.floor(Math.random() * letters.length)])
          }
        >
          Rediscover a letter ↻
        </button>
      </div>
      <div className="toolbar">
        <div className="chips">
          {[
            ["all", "All letters"],
            ["received", "For you"],
            ["sent", "From you"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          aria-label="Search letters"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a word, a moment…"
        />
      </div>
      {!filtered.length && (
        <p className="empty-state">
          {letters.length
            ? "No letters match that search."
            : "Your story can begin with a letter."}
        </p>
      )}
      {filtered.map((l) => {
        const mine = l.from_id === userId;
        const profile = Array.isArray(l.from_profile)
          ? l.from_profile[0]
          : l.from_profile;
        return (
          <button
            key={l.id}
            className="archive-row"
            onClick={() => setSelected(l)}
          >
            <div className="archive-date">
              {dateLabel(l.sent_at)}
              <br />
              {mine ? "FROM YOU" : profile?.display_name || "FOR YOU"}
            </div>
            <div>
              <p className="eyebrow">
                {!mine && !l.read_at
                  ? "UNOPENED LETTER"
                  : "A PAGE IN OUR STORY"}
              </p>
              <h3>
                {l.subject ||
                  l.body
                    .split("\n")
                    .find((x) => x.trim())
                    ?.slice(0, 75) ||
                  "For you"}
              </h3>
              <p className="preview">
                {l.body.slice(0, 160)}
                {l.body.length > 160 ? "…" : ""}
              </p>
            </div>
            <span className="archive-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        );
      })}
      <dialog
        ref={dialog}
        className={`reader ${expanded ? "expanded" : ""}`}
        onCancel={close}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialog.current) {
            const r = dialog.current.getBoundingClientRect();
            if (
              e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom
            )
              close();
          }
        }}
        aria-labelledby="reader-title"
      >
        <div className="reader-inner">
          <div className="reader-tools">
            <p className="eyebrow">{selected && dateLabel(selected.sent_at)}</p>
            <div style={{ display: "flex", gap: 20 }}>
              <button
                className="text-link"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Focus view" : "Expand"}
              </button>
              <button className="text-link" onClick={close}>
                Close ×
              </button>
            </div>
          </div>
          <h2 id="reader-title">{selected?.subject || "A letter for you"}</h2>
          <div className="letter-body">{selected?.body}</div>
          <Link
            href={"/letters/write"}
            onClick={close}
            className="text-link"
            style={{ marginTop: 30 }}
          >
            Write a letter back ↗
          </Link>
        </div>
      </dialog>
    </>
  );
}
