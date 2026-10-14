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
  partnerName,
}: {
  letters: LetterItem[];
  userId: string;
  partnerName: string;
}) {
  const [selected, setSelected] = useState<LetterItem | null>(null),
    [expanded, setExpanded] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [order, setOrder] = useState("newest"),
    [largeType, setLargeType] = useState(false),
    [opened, setOpened] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = useMemo(
    () =>
      letters
        .filter(
          (l) =>
            (filter === "all" ||
              (filter === "received" && l.to_id === userId) ||
              (filter === "unread" &&
                l.to_id === userId &&
                !l.read_at &&
                !opened.includes(l.id)) ||
              (filter === "sent" && l.from_id === userId)) &&
            `${l.subject || ""} ${l.body}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          order === "newest"
            ? b.sent_at.localeCompare(a.sent_at)
            : a.sent_at.localeCompare(b.sent_at),
        ),
    [letters, query, filter, userId, order, opened],
  );
  useEffect(() => {
    if (selected) {
      dialog.current?.showModal();
      if (selected.to_id === userId && !selected.read_at)
        void markAsRead(selected.id)
          .then(() =>
            setOpened((ids) =>
              ids.includes(selected.id) ? ids : [...ids, selected.id],
            ),
          )
          .catch(() => {});
    } else dialog.current?.close();
  }, [selected, userId]);
  function close() {
    setSelected(null);
    setExpanded(false);
  }
  const readingOrder = [...letters].sort((a, b) =>
    a.sent_at.localeCompare(b.sent_at),
  );
  const readingIndex = readingOrder.findIndex((l) => l.id === selected?.id);
  return (
    <>
      <div className="archive-intro-strip">
        <div>
          <span className="eyebrow">THE CORRESPONDENCE</span>
          <p>{letters.length} letters. Start anywhere. Stay a while.</p>
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
            ["received", `From ${partnerName}`],
            ["unread", "Unopened"],
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
      <div className="reading-controls">
        <p className="eyebrow" role="status">
          {filtered.length} {filtered.length === 1 ? "LETTER" : "LETTERS"} IN
          THIS VIEW
        </p>
        <select
          aria-label="Letter order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="newest">Latest first</option>
          <option value="oldest">From the first hello</option>
        </select>
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
              {mine ? "FROM YOU" : profile?.display_name || partnerName}
            </div>
            <div>
              <p className="eyebrow">
                {!mine && !l.read_at && !opened.includes(l.id)
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
          <div className="reading-controls">
            <span className="eyebrow">
              LETTER {readingIndex + 1} OF {letters.length}
            </span>
            <button
              className="text-link"
              aria-pressed={largeType}
              onClick={() => setLargeType(!largeType)}
            >
              Larger type Aa
            </button>
          </div>
          <div className={`letter-body ${largeType ? "large-type" : ""}`}>
            {selected?.body}
          </div>
          <div className="reading-controls reader-pagination">
            <button
              className="text-link"
              disabled={readingIndex <= 0}
              onClick={() => {
                setSelected(readingOrder[readingIndex - 1]);
                dialog.current?.scrollTo(0, 0);
              }}
            >
              ← Previous letter
            </button>
            <button
              className="text-link"
              disabled={readingIndex >= readingOrder.length - 1}
              onClick={() => {
                setSelected(readingOrder[readingIndex + 1]);
                dialog.current?.scrollTo(0, 0);
              }}
            >
              Next letter →
            </button>
          </div>
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
