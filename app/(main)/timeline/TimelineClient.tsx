/* eslint-disable @next/next/no-img-element -- Signed private photos must not pass through a public optimizer. */
"use client";
import { useState } from "react";
import Link from "next/link";
import type { TimelineEntry } from "@/types/database";
import { dateLabel } from "@/lib/validation";
export default function TimelineClient({
  entries,
}: {
  entries: TimelineEntry[];
  userId: string;
}) {
  const [filter, setFilter] = useState("all"),
    [order, setOrder] = useState("newest"),
    [year, setYear] = useState("all"),
    [month, setMonth] = useState(""),
    [query, setQuery] = useState(""),
    [album, setAlbum] = useState(false);
  const entryDate = (e: TimelineEntry) =>
    e.kind === "moment" ? e.occurred_at : e.sent_at;
  const years = [...new Set(entries.map((e) => entryDate(e).slice(0, 4)))]
    .sort()
    .reverse();
  const items = entries
    .filter(
      (e) =>
        (album
          ? e.kind === "postcard"
          : filter === "all" || e.kind === filter) &&
        (year === "all" || entryDate(e).startsWith(year)) &&
        (!month || entryDate(e).startsWith(month)) &&
        (e.kind === "letter"
          ? `${e.subject || ""} ${e.body}`
          : e.kind === "moment"
            ? `${e.title} ${e.note || ""}`
            : e.caption || ""
        )
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const d = (e: TimelineEntry) =>
        new Date(e.kind === "moment" ? e.occurred_at : e.sent_at).getTime();
      return order === "newest" ? d(b) - d(a) : d(a) - d(b);
    });
  return (
    <>
      <div className="chapter-rail" aria-label="Story chapters">
        <span className="eyebrow">OUR CHAPTERS</span>
        <button
          aria-pressed={year === "all"}
          onClick={() => {
            setYear("all");
            setMonth("");
          }}
        >
          All years
        </button>
        {years.map((y) => (
          <button
            key={y}
            aria-pressed={year === y}
            onClick={() => {
              setYear(y);
              setMonth("");
            }}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <div className="chips">
          {[
            ["all", "Everything"],
            ["postcard", "Photos"],
            ["letter", "Letters"],
            ["moment", "Moments"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              onClick={() => {
                setFilter(v);
                setAlbum(false);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <select
          aria-label="Timeline order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          style={{ width: "auto", fontSize: 13 }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">From the beginning</option>
        </select>
      </div>
      <div className="timeline-finder">
        <input
          aria-label="Search our story"
          placeholder="A place, a phrase, that one day…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Jump to month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">Every month</option>
          {[...new Set(entries.map((e) => entryDate(e).slice(0, 7)))]
            .filter((m) => year === "all" || m.startsWith(year))
            .sort()
            .reverse()
            .map((m) => (
              <option key={m} value={m}>
                {new Intl.DateTimeFormat("en-AU", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${m}-01T12:00:00Z`))}
              </option>
            ))}
        </select>
        <button
          className="button secondary"
          aria-pressed={album}
          onClick={() => setAlbum(!album)}
        >
          {album ? "Back to the timeline" : "Spread out the photos ↗"}
        </button>
      </div>
      <p className="eyebrow result-count" role="status">
        {items.length} {album ? "PHOTOGRAPHS" : "ENTRIES"}
      </p>
      {!items.length && (
        <p className="empty-state">
          {entries.length
            ? "No moments in this view yet."
            : "Your letters, photos and little milestones will find a home here."}
        </p>
      )}
      <div className={album ? "photo-spread" : "story-sequence"}>
        {items.map((e) => (
          <article className="timeline-entry" key={e.kind + e.id}>
            <div className="archive-date">
              {dateLabel(e.kind === "moment" ? e.occurred_at : e.sent_at)}
            </div>
            <div className="entry-content">
              <p className="eyebrow">
                {e.kind === "postcard"
                  ? "A PHOTO TO KEEP"
                  : e.kind === "moment"
                    ? "A LITTLE MILESTONE"
                    : "A LETTER"}
              </p>
              {e.kind === "letter" ? (
                <>
                  <h3>{e.subject || "In your own words"}</h3>
                  <p>
                    {e.body.slice(0, 220)}
                    {e.body.length > 220 ? "…" : ""}
                  </p>
                  <Link
                    className="text-link"
                    href={`/letters/${e.id}`}
                    prefetch={false}
                  >
                    Open the letter ↗
                  </Link>
                </>
              ) : e.kind === "moment" ? (
                <>
                  <h3>{e.title}</h3>
                  <p>{e.note}</p>
                </>
              ) : (
                <>
                  {e.image_url ? (
                    <img
                      className="memory-photo"
                      src={e.image_url}
                      alt={e.caption || "A shared memory"}
                      loading="lazy"
                    />
                  ) : (
                    <p className="empty-state">
                      This photo could not be loaded. Try reopening the page.
                    </p>
                  )}
                  <h3>{e.caption || "One of our days"}</h3>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
