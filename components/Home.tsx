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
  firstLetterDate: string | null;
  mood: { mood: string; need: string; phase: string } | null;
  plan: { title: string; planned_for: string | null } | null;
  book: { title: string; progress: number } | null;
  photo: { url: string; caption: string | null } | null;
};
const prompts = [
  "What’s a tiny thing I do that makes you feel loved?",
  "Which ordinary day of ours would you live again?",
  "What do you need more of from us this week?",
  "What’s something you’ve read that changed how you see the world?",
  "Where should our next little adventure take us?",
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
          <i /> Your shared space
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
              ? `Writing our story since ${dateLabel(data.firstLetterDate)}.`
              : "Your words. Your days. Your shared story."}
          </p>
          <Link href={route("/letters/write")} className="button">
            Write to {data.partnerName} <span>↗</span>
          </Link>
        </div>
        <Link href={route("/timeline")} className="world-caption">
          <span>FROM OUR CAMERA ROLL</span>
          {data.photo?.caption || "Start collecting your days together"} ↗
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
          <span>letters, kept forever ↗</span>
        </Link>
        <div>
          <span className="eyebrow">
            TUNING INTO {data.partnerName.toUpperCase()}
          </span>
          <p>
            {data.mood
              ? `${data.mood.mood} · ${data.mood.need || data.mood.phase || "A little check-in"}`
              : "A little check-in can bring you closer."}
          </p>
        </div>
        <Link className="text-link" href={route("/mood")}>
          Check in together ↗
        </Link>
      </div>
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
            href={
              data.unread ? `/letters/${data.unread.id}` : route("/letters")
            }
          >
            <div className="envelope-stamp">
              L<span>FOR TWO</span>
            </div>
            <p className="eyebrow">
              {data.unread ? "WAITING TO BE OPENED" : "THE WORDS WE KEEP"}
            </p>
            <h3>{data.unread?.subject || "Some things deserve a letter."}</h3>
            <p className="envelope-excerpt">
              {data.unread
                ? `${data.unread.body.slice(0, 130)}…`
                : "Your history is here. Revisit a familiar page, or write the next one."}
            </p>
            <span className="wax-seal" aria-hidden="true">
              ✳
            </span>
            <span className="envelope-open">Open slowly ↗</span>
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
          <h2>{data.plan?.title || "Let’s make a day of it."}</h2>
          <p>
            {data.plan?.planned_for
              ? dateLabel(data.plan.planned_for + "T12:00:00Z")
              : "Pick an idea that fits the way you both feel."}
          </p>
          <Link className="button secondary" href={route("/together")}>
            Make a plan ↗
          </Link>
        </div>
        <Link className="nightstand" href={route("/library")}>
          <span className="eyebrow">ON THE NIGHTSTAND</span>
          <div className="mini-book">
            <span>OUR LIBRARY</span>
            <h3>{data.book?.title || "The next thing that moves us."}</h3>
            <i>notes in the margins</i>
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
