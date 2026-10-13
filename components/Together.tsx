"use client";
import { useState } from "react";
import { PlanCalendar } from "./PlanCalendar";
import { PageHeading } from "./PageHeading";
import { ActionForm } from "./ActionForm";
import { addPlan, updatePlan } from "@/app/actions/journal";
import { ideas } from "@/lib/ideas";
import { dateLabel } from "@/lib/validation";
export type Plan = {
  id: string;
  user_id: string;
  title: string;
  note: string;
  energy: string;
  planned_for: string | null;
  status: string;
};
export function Together({
  plans,
  partnerName,
  userId,
  initialEnergy = "gentle",
}: {
  plans: Plan[];
  partnerName: string;
  userId: string;
  initialEnergy?: string;
}) {
  const [filter, setFilter] = useState("all"),
    [title, setTitle] = useState(""),
    [note, setNote] = useState(""),
    [energy, setEnergy] = useState(
      ["gentle", "steady", "adventurous"].includes(initialEnergy)
        ? initialEnergy
        : "gentle",
    ),
    [date, setDate] = useState(""),
    [ideaIndex, setIdeaIndex] = useState(0);
  const suggestions = ideas.filter((i) => i.energy === energy);
  const surprise = suggestions[ideaIndex % suggestions.length];
  return (
    <>
      <PageHeading
        number="05"
        title="More days like this."
        description={`Your next day with ${partnerName}. A shared calendar, your someday list, and ideas for the mood you’re in.`}
      />
      <div className="date-lab">
        <div>
          <p className="eyebrow">THE DATE LAB / MADE FOR YOUR KIND OF DAY</p>
          <h2>
            Less “what should we do?”
            <br />
            <em>More doing it together.</em>
          </h2>
          <div className="chips">
            {[
              ["gentle", "Low-key"],
              ["steady", "Out & about"],
              ["adventurous", "Something new"],
            ].map(([v, l]) => (
              <button
                key={v}
                aria-pressed={energy === v}
                onClick={() => {
                  setEnergy(v);
                  setIdeaIndex(0);
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="surprise-idea" key={energy + ideaIndex}>
          <span className="eyebrow">YOUR NEXT LITTLE ADVENTURE</span>
          <h3>{surprise.title}</h3>
          <p>{surprise.note}</p>
          <div>
            <button
              className="button"
              onClick={() => {
                setTitle(surprise.title);
                setNote(surprise.note);
                document.getElementById("plan-title")?.focus();
              }}
            >
              Let’s do this ↗
            </button>
            <button
              className="text-link"
              onClick={() => setIdeaIndex(ideaIndex + 1)}
            >
              Another idea ↻
            </button>
          </div>
        </div>
      </div>
      <div className="together-layout">
        <section>
          <PlanCalendar plans={plans} onChoose={setDate} />
          <div className="chips" style={{ marginBottom: 28 }}>
            {[
              ["all", "Everything"],
              ["idea", "Someday"],
              ["planned", "On the calendar"],
              ["done", "We did this"],
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
          {plans
            .filter((p) => filter === "all" || p.status === filter)
            .map((p) => (
              <article className="plan-item" key={p.id}>
                <p className="eyebrow">
                  {p.planned_for
                    ? dateLabel(p.planned_for + "T12:00:00Z")
                    : "SOMEDAY"}{" "}
                  / {p.energy} / {p.status}
                </p>
                <h3>{p.title}</h3>
                <p>{p.note}</p>
                {p.user_id === userId && (
                  <ActionForm action={updatePlan} className="inline-form">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      name="status"
                      aria-label={`Status of ${p.title}`}
                      defaultValue={p.status}
                    >
                      <option value="idea">Someday idea</option>
                      <option value="planned">Planned</option>
                      <option value="done">We did this</option>
                    </select>
                    <input
                      type="date"
                      name="planned_for"
                      aria-label={`Date of ${p.title}`}
                      defaultValue={p.planned_for ?? ""}
                    />
                    <button className="text-link">Update ↗</button>
                  </ActionForm>
                )}
              </article>
            ))}
          {!plans.length && (
            <p className="empty-state">
              Start with a little idea. You can choose the day later.
            </p>
          )}
          <div className="section-heading" style={{ marginTop: 45 }}>
            <h2>A little inspiration</h2>
            <select
              aria-label="Ideas by energy"
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              style={{ width: "auto", fontSize: 13 }}
            >
              <option value="gentle">Gentle days</option>
              <option value="steady">A little exploring</option>
              <option value="adventurous">An adventure</option>
            </select>
          </div>
          <div className="idea-list">
            {ideas
              .filter((i) => i.energy === energy)
              .map((i) => (
                <button
                  key={i.title}
                  onClick={() => {
                    setTitle(i.title);
                    setNote(i.note);
                    document.getElementById("plan-title")?.focus();
                  }}
                >
                  {i.title} <span aria-hidden="true">↗</span>
                  <small>{i.note}</small>
                </button>
              ))}
          </div>
        </section>
        <aside className="aside-form">
          <h2>Make a little plan</h2>
          <ActionForm action={addPlan}>
            <div>
              <label htmlFor="plan-title">What shall we do?</label>
              <input
                id="plan-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={250}
              />
            </div>
            <div>
              <label htmlFor="plan-note">The details</label>
              <textarea
                id="plan-note"
                name="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={5000}
              />
            </div>
            <div>
              <label htmlFor="planned-for">A day (optional)</label>
              <input
                id="planned-for"
                name="planned_for"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="plan-energy">What kind of day?</label>
              <select
                id="plan-energy"
                name="energy"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
              >
                <option value="gentle">Gentle</option>
                <option value="steady">Steady</option>
                <option value="adventurous">Adventurous</option>
              </select>
            </div>
            <button className="button">Save our plan ↗</button>
          </ActionForm>
        </aside>
      </div>
    </>
  );
}
