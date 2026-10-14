/* eslint-disable @next/next/no-img-element -- Private signed photographs bypass public optimization. */
"use client";
import Link from "next/link";
import { useState } from "react";
import { dateLabel } from "@/lib/validation";
export type HomeData = {
  myName: string;
  partnerName: string;
  unread: {
    id: string;
    subject: string | null;
    body: string;
    sent_at: string;
  } | null;
  letterCount: number;
  unreadCount: number;
  draft: { subject: string; updated_at: string } | null;
  firstLetterDate: string | null;
  mood: {
    mood: string;
    need: string;
    phase: string;
    created_at: string;
  } | null;
  plan: { title: string; planned_for: string | null } | null;
  book: { title: string; progress: number } | null;
  photo: { url: string; caption: string | null } | null;
};
const prompts = [
  "What did you nearly tell me today, then save for later?",
  "Which day would you like a few more hours of?",
  "Do you want advice, company, or someone firmly on your side?",
  "What have you read lately that you want to argue about with me?",
  "Where should we go with absolutely no sensible reason?",
];
export function Home({ data }: { data: HomeData }) {
  const [prompt, setPrompt] = useState(0);
  const route = (p: string) => p;
  return (
    <>
      <div className="studio-heading">
        <p className="eyebrow">
          {dateLabel(new Date().toISOString())} / JUST THE TWO OF US
        </p>
        <span className="live-label">
          <i /> Our correspondence
        </span>
      </div>
      <section className="our-world">
        {data.photo && (
          <img
            src={data.photo.url}
            alt={data.photo.caption || "A memory from your story"}
            className="world-photo"
          />
        )}
        <div className="world-shade" />
        <div className="world-copy">
          <p className="eyebrow">
            {data.myName} & {data.partnerName}
          </p>
          <h1>
            {data.myName}
            <br />
            <em>& {data.partnerName}.</em>
          </h1>
          <p>
            {data.firstLetterDate
              ? `Corresponding since ${dateLabel(data.firstLetterDate)}. Still finding things to say.`
              : "The long version belongs here."}
          </p>
          <Link href={route("/letters/write")} className="button">
            Write to {data.partnerName} <span>↗</span>
          </Link>
        </div>
        <Link href={route("/timeline")} className="world-caption">
          <span>FROM OUR CAMERA ROLL</span>
          {data.photo?.caption || "A day we’ll want back"} ↗
        </Link>
        <div className="world-index">
          {data.firstLetterDate
            ? new Date(data.firstLetterDate).getFullYear()
            : "US"}{" "}
          <span>STILL WRITING</span>
        </div>
      </section>
      <div className="connection-strip">
        <Link href={route("/letters")}>
          <b>{data.letterCount.toString().padStart(2, "0")}</b>
          <span>letters to come back to ↗</span>
        </Link>
        <div>
          <span className="eyebrow">
            TODAY, WITH {data.partnerName.toUpperCase()}
          </span>
          <p>
            {data.mood
              ? `${data.mood.mood} · ${data.mood.need || data.mood.phase || "A little check-in"}`
              : "How’s today treating you? The honest version."}
          </p>
          {data.mood && (
            <small className="eyebrow">
              LAST CHECK-IN · {dateLabel(data.mood.created_at)}
            </small>
          )}
        </div>
        <Link className="text-link" href={route("/mood")}>
          Check in together ↗
        </Link>
      </div>
      {data.draft && (
        <Link className="draft-bookmark" href="/letters/write">
          <div>
            <span className="eyebrow">WHERE YOU LEFT OFF · PRIVATE DRAFT</span>
            <h2>
              {data.draft.subject ||
                `An unfinished letter to ${data.partnerName}`}
            </h2>
            <p>Last saved {dateLabel(data.draft.updated_at)}</p>
          </div>
          <span>Keep writing ↗</span>
        </Link>
      )}
      <div className="desk-layout">
        <section className="inbox-desk">
          <div className="section-heading">
            <h2>
              On your desk<span className="tiny-star">✳</span>
            </h2>
            <Link href={route("/letters")} className="text-link">
              The archive ↗
            </Link>
          </div>
          <Link
            className="envelope"
            prefetch={false}
            href={
              data.unread ? `/letters/${data.unread.id}` : route("/letters")
            }
          >
            <div className="envelope-stamp">
              L<span>FOR TWO</span>
            </div>
            <p className="eyebrow">
              {data.unread
                ? `${data.unreadCount} ${data.unreadCount === 1 ? "LETTER" : "LETTERS"} WAITING FOR YOU`
                : "THE WORDS WE KEEP"}
            </p>
            <h3>{data.unread?.subject || "And another thing…"}</h3>
            <p className="envelope-excerpt">
              {data.unread
                ? `${data.unread.body.slice(0, 130)}…`
                : "Back to the first hello, or straight to the latest tangent."}
            </p>
            <span className="wax-seal" aria-hidden="true">
              ✳
            </span>
            <span className="envelope-open">Open the correspondence ↗</span>
          </Link>
        </section>
        <section className="conversation-deck">
          <p className="eyebrow">
            BETWEEN US / CONVERSATION NO. {String(prompt + 1).padStart(2, "0")}
          </p>
          <h2 key={prompt} aria-live="polite">
            {prompts[prompt]}
          </h2>
          <div>
            <button
              className="text-link"
              onClick={() => setPrompt((prompt + 1) % prompts.length)}
            >
              Another question ↻
            </button>
            <Link href={route("/letters/write")} className="text-link">
              Answer in a letter ↗
            </Link>
          </div>
        </section>
      </div>
      <div className="next-chapter">
        <div>
          <p className="eyebrow">SOMETHING TO LOOK FORWARD TO</p>
          <h2>{data.plan?.title || "When do I get to see you?"}</h2>
          <p>
            {data.plan?.planned_for
              ? dateLabel(data.plan.planned_for + "T12:00:00Z")
              : "Pick a day. The details can be a conversation."}
          </p>
          <Link className="button secondary" href={route("/together")}>
            Make a plan ↗
          </Link>
        </div>
        <Link className="nightstand" href={route("/library")}>
          <span className="eyebrow">ON THE NIGHTSTAND</span>
          <div className="mini-book">
            <span>OUR LIBRARY</span>
            <h3>{data.book?.title || "You need to read this."}</h3>
            <i>and then we need to talk</i>
          </div>
          <span>
            {data.book
              ? `${data.book.progress}% read · Pick up where you left off`
              : "Books, videos & things to talk about"}{" "}
            ↗
          </span>
        </Link>
      </div>
    </>
  );
}
