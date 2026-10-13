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
    [year, setYear] = useState("all");
  const entryDate = (e: TimelineEntry) =>
    e.kind === "moment" ? e.occurred_at : e.sent_at;
  const years = [...new Set(entries.map((e) => entryDate(e).slice(0, 4)))]
    .sort()
    .reverse();
  const items = entries
    .filter(
      (e) =>
        (filter === "all" || e.kind === filter) &&
        (year === "all" || entryDate(e).startsWith(year)),
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
        <button aria-pressed={year === "all"} onClick={() => setYear("all")}>
          All years
        </button>
        {years.map((y) => (
          <button key={y} aria-pressed={year === y} onClick={() => setYear(y)}>
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
              onClick={() => setFilter(v)}
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
      {!items.length && (
        <p className="empty-state">
          {entries.length
            ? "No moments in this view yet."
            : "Your letters, photos and little milestones will find a home here."}
        </p>
      )}
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
                <Link className="text-link" href={`/letters/${e.id}`}>
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
    </>
  );
}
