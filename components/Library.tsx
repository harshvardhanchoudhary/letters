"use client";
import { useState } from "react";
import { PageHeading } from "./PageHeading";
import { ActionForm } from "./ActionForm";
import {
  addLibraryItem,
  addLibraryNote,
  updateReading,
} from "@/app/actions/journal";
export type LibraryItem = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  author: string;
  url: string | null;
  status: string;
  progress: number;
};
export type LibraryNote = {
  id: string;
  item_id: string;
  user_id: string;
  body: string;
  is_private: boolean;
  created_at: string;
};
export function Library({
  items,
  notes,
  userId,
  partnerName,
}: {
  items: LibraryItem[];
  notes: LibraryNote[];
  userId: string;
  partnerName: string;
}) {
  const [filter, setFilter] = useState("all"),
    [kind, setKind] = useState("book"),
    [search, setSearch] = useState(""),
    [reading, setReading] = useState("all"),
    [owner, setOwner] = useState("both");
  const visible = items.filter(
    (x) =>
      (filter === "all" || x.kind === filter) &&
      (owner === "both" ||
        (owner === "mine" ? x.user_id === userId : x.user_id !== userId)) &&
      (reading === "all" || (x.kind === "book" && x.status === reading)) &&
      `${x.title} ${x.author}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        number="04"
        title="The things we find."
        description={`Your finds and ${partnerName}’s. Books, notes and conversations to come back to.`}
      />
      {items.some((x) => x.kind === "book") && (
        <section className="bookshelf" aria-label="Our bookshelf">
          <div className="shelf-caption">
            <span className="eyebrow">OUR COLLECTED WORLDS</span>
            <h2>
              Stay a little
              <br />
              <em>longer.</em>
            </h2>
          </div>
          <div className="shelf-books">
            {items
              .filter((x) => x.kind === "book")
              .map((book, i) => (
                <button
                  key={book.id}
                  className={`shelf-book cover-${i % 3}`}
                  onClick={() => {
                    setFilter("book");
                    setReading("all");
                    setSearch(book.title);
                    document
                      .getElementById("library-results")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span>{book.author || "OUR LIBRARY"}</span>
                  <strong>{book.title}</strong>
                  <i>{book.progress}% read</i>
                </button>
              ))}
          </div>
        </section>
      )}
      <div className="library-layout" id="library-results">
        <section>
          <div className="chips" style={{ marginBottom: 18 }}>
            {[
              ["both", "Both of us"],
              ["mine", "My finds"],
              ["theirs", `${partnerName}’s finds`],
            ].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={owner === v}
                onClick={() => setOwner(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="library-search">
            <input
              aria-label="Search library"
              placeholder="Find a title or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter reading status"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
            >
              <option value="all">All reading stages</option>
              <option value="want">Want to read</option>
              <option value="reading">Reading now</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div className="chips" style={{ marginBottom: 28 }}>
            {[
              ["all", "Everything"],
              ["book", "Books"],
              ["video", "Videos"],
              ["article", "Articles"],
            ].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={filter === v}
                onClick={() => {
                  setFilter(v);
                  setReading("all");
                  setSearch("");
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="empty-state">
              Save a book, a video, or an article. Make a little room for what
              moves you.
            </p>
          )}
          {visible.map((item) => (
            <article className="library-item" key={item.id}>
              <div className="item-top">
                <div className="book-spine" aria-hidden="true">
                  {item.kind === "book"
                    ? "▤"
                    : item.kind === "video"
                      ? "▷"
                      : "↗"}
                </div>
                <div>
                  <p className="eyebrow">
                    {item.kind}{" "}
                    {item.kind === "book" &&
                      `/ ${item.status === "want" ? "TO READ" : item.status === "reading" ? "READING" : "FINISHED"}`}
                  </p>
                  <h3>{item.title}</h3>
                  {item.author && <p>{item.author}</p>}
                  {item.url && (
                    <a
                      className="item-link"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.kind === "video"
                        ? "Watch video"
                        : item.kind === "book"
                          ? "Open book link"
                          : "Read article"}{" "}
                      ↗
                    </a>
                  )}
                </div>
              </div>
              {item.kind === "book" && (
                <>
                  <div className="progress-line">
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <p className="eyebrow">{item.progress}% THROUGH</p>
                  {item.user_id === userId && (
                    <ActionForm action={updateReading} className="inline-form">
                      <input type="hidden" name="id" value={item.id} />
                      <label
                        htmlFor={`progress-${item.id}`}
                        style={{ margin: 0 }}
                      >
                        Progress %
                      </label>
                      <input
                        id={`progress-${item.id}`}
                        aria-label={`Progress for ${item.title}`}
                        name="progress"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={item.progress}
                        required
                      />
                      <select
                        aria-label={`Reading status for ${item.title}`}
                        name="status"
                        defaultValue={item.status}
                      >
                        <option value="want">To read</option>
                        <option value="reading">Reading</option>
                        <option value="finished">Finished</option>
                      </select>
                      <button className="text-link">Update ↗</button>
                    </ActionForm>
                  )}
                </>
              )}
              <details style={{ marginTop: 20 }}>
                <summary className="text-link">
                  Notes & discussion (
                  {notes.filter((n) => n.item_id === item.id).length}) +
                </summary>
                <div className="notes-list">
                  {notes
                    .filter((n) => n.item_id === item.id)
                    .map((n) => (
                      <div className="note" key={n.id}>
                        <div className="note-meta">
                          {n.user_id === userId
                            ? "YOU"
                            : partnerName.toUpperCase()}{" "}
                          · {n.is_private ? "ONLY YOU" : "SHARED"}
                        </div>
                        <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
                      </div>
                    ))}
                </div>
                <ActionForm action={addLibraryNote} className="note-form" reset>
                  <input type="hidden" name="item_id" value={item.id} />
                  <label htmlFor={`note-${item.id}`}>
                    A quote, reflection, or something to discuss
                  </label>
                  <textarea
                    id={`note-${item.id}`}
                    name="body"
                    rows={3}
                    required
                    maxLength={10000}
                  />
                  <label className="check-row">
                    <input type="checkbox" name="is_private" defaultChecked />
                    Keep this note just for me
                  </label>
                  <button
                    className="button secondary"
                    style={{ justifySelf: "start" }}
                  >
                    Save note ↗
                  </button>
                </ActionForm>
              </details>
            </article>
          ))}
        </section>
        <aside className="aside-form">
          <h2>Add to the library</h2>
          <ActionForm action={addLibraryItem} reset>
            <div>
              <label htmlFor="kind">What did you find?</label>
              <select
                id="kind"
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="book">A book</option>
                <option value="video">A YouTube video</option>
                <option value="article">An article</option>
              </select>
            </div>
            <div>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                required
                maxLength={250}
                placeholder={
                  kind === "book"
                    ? "The book on your nightstand"
                    : "Something worth sharing"
                }
              />
            </div>
            <div>
              <label htmlFor="author">Author or creator</label>
              <input id="author" name="author" maxLength={250} />
            </div>
            <div>
              <label htmlFor="url">
                Link {kind === "book" ? "(optional)" : ""}
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required={kind !== "book"}
                placeholder="https://…"
                maxLength={2000}
              />
            </div>
            <button className="button">Keep it here ↗</button>
          </ActionForm>
          <p className="subtitle" style={{ fontSize: 14, marginTop: 20 }}>
            Saved finds are shared. Your notes can stay private.
          </p>
        </aside>
      </div>
    </>
  );
}
