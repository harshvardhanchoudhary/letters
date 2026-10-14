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
    [owner, setOwner] = useState("both"),
    [discussion, setDiscussion] = useState(false),
    [spotlight, setSpotlight] = useState<string | null>(null);
  const sharedItems = items.filter((item) =>
    notes.some((n) => n.item_id === item.id && !n.is_private),
  );
  function openItem(item: LibraryItem) {
    setFilter("all");
    setReading("all");
    setOwner("both");
    setDiscussion(false);
    setSearch("");
    setSpotlight(item.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`find-${item.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      const thread = document.getElementById(
        `discussion-${item.id}`,
      ) as HTMLDetailsElement | null;
      if (thread) thread.open = true;
    });
  }
  const visible = items.filter(
    (x) =>
      (filter === "all" || x.kind === filter) &&
      (owner === "both" ||
        (owner === "mine" ? x.user_id === userId : x.user_id !== userId)) &&
      (reading === "all" || (x.kind === "book" && x.status === reading)) &&
      (!discussion || sharedItems.some((i) => i.id === x.id)) &&
      `${x.title} ${x.author} ${notes
        .filter((n) => n.item_id === x.id)
        .map((n) => n.body)
        .join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        number="04"
        title="Read this. Then tell me."
        description={`Books to finish, passages to keep, links to send ${partnerName} down a rabbit hole.`}
      />
      <section className="conversation-shelf">
        <div>
          <p className="eyebrow">FOR OUR NEXT CONVERSATION</p>
          <h2>
            {sharedItems.length
              ? `${sharedItems.length} ${sharedItems.length === 1 ? "thing" : "things"} still worth talking about.`
              : "I have thoughts. You first."}
          </h2>
          <p>
            Shared notes collect here. Private notes stay in your own margins.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={!sharedItems.length}
          onClick={() => {
            const next =
              (sharedItems.findIndex((i) => i.id === spotlight) + 1) %
              sharedItems.length;
            openItem(sharedItems[next]);
          }}
        >
          Pick something to discuss ↻
        </button>
      </section>
      {items.some((x) => x.kind === "book") && (
        <section className="bookshelf" aria-label="Our bookshelf">
          <div className="shelf-caption">
            <span className="eyebrow">NOT FINISHED TALKING ABOUT IT</span>
            <h2>
              Read it.
              <br />
              <em>Compare notes.</em>
            </h2>
          </div>
          <div className="shelf-books">
            {items
              .filter((x) => x.kind === "book")
              .map((book, i) => (
                <button
                  key={book.id}
                  className={`shelf-book cover-${i % 3}`}
                  onClick={() => openItem(book)}
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
              placeholder="Search titles, authors and your notes…"
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
          <div className="reading-controls">
            <button
              className="text-link"
              aria-pressed={discussion}
              onClick={() => setDiscussion(!discussion)}
            >
              {discussion ? "Show all finds" : "With shared discussion only"}
            </button>
            <span className="eyebrow" role="status">
              {visible.length} FINDS
            </span>
          </div>
          {!visible.length && (
            <p className="empty-state">
              {items.length
                ? "Nothing matches this view. Try another filter or search."
                : "Save the book, video, or article you want to talk about."}
            </p>
          )}
          {visible.map((item) => (
            <article
              className={`library-item ${spotlight === item.id ? "find-spotlight" : ""}`}
              id={`find-${item.id}`}
              key={item.id}
            >
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
              <details id={`discussion-${item.id}`} style={{ marginTop: 20 }}>
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
                    placeholder="The bit I underlined. The part I disagree with. The question I want to ask you."
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
