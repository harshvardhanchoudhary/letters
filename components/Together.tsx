"use client";
import { useState } from "react";
import { PlanCalendar } from "./PlanCalendar";
import { PageHeading } from "./PageHeading";
import { ActionForm } from "./ActionForm";
import { addPlan, updatePlan } from "@/app/actions/journal";
import { ideas } from "@/lib/ideas";
import { calendarEvent } from "@/lib/journal-tools";
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
    [ideaIndex, setIdeaIndex] = useState(0),
    [time, setTime] = useState("any"),
    [setting, setSetting] = useState("any"),
    [notice, setNotice] = useState("");
  function chooseIdea(idea: { title: string; note: string }) {
    setTitle(idea.title);
    setNote(idea.note);
    setNotice("Added to the form. Choose a day if you like, then save it.");
    document.getElementById("plan-title")?.focus();
  }
  function downloadCalendar(plan: Plan) {
    const blob = new Blob([calendarEvent(plan)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "letters-date.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Calendar file downloaded. Open it to add the date to your calendar.",
    );
  }
  const suggestions = ideas.filter(
    (i) =>
      i.energy === energy &&
      (time === "any" || i.minutes <= Number(time)) &&
      (setting === "any" || i.setting === setting),
  );
  const surprise = suggestions[ideaIndex % suggestions.length];
  return (
    <>
      <PageHeading
        number="05"
        title="So, when are we going?"
        description={`Make a date with ${partnerName}, or save the idea until you both have the energy.`}
      />
      <div className="date-lab">
        <div>
          <p className="eyebrow">THE DATE LAB / MADE FOR YOUR KIND OF DAY</p>
          <h2>
            We should do that.
            <br />
            <em>Okay. When?</em>
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
          <div className="idea-constraints">
            <label>
              How long?
              <select
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setIdeaIndex(0);
                }}
              >
                <option value="any">No rush</option>
                <option value="30">Half an hour</option>
                <option value="60">An hour</option>
              </select>
            </label>
            <label>
              Where?
              <select
                value={setting}
                onChange={(e) => {
                  setSetting(e.target.value);
                  setIdeaIndex(0);
                }}
              >
                <option value="any">Anywhere</option>
                <option value="home">Stay in</option>
                <option value="out">Go out</option>
              </select>
            </label>
          </div>
        </div>
        <div className="surprise-idea" key={energy + ideaIndex}>
          {surprise ? (
            <>
              <span className="eyebrow">
                {surprise.minutes} MINUTES OR SO /{" "}
                {surprise.setting === "home" ? "STAYING IN" : "HEADING OUT"}
              </span>
              <h3>{surprise.title}</h3>
              <p>{surprise.note}</p>
              <div>
                <button
                  className="button"
                  onClick={() => {
                    chooseIdea(surprise);
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
            </>
          ) : (
            <>
              <h3>Nothing in this particular hat.</h3>
              <p>
                Try a longer window, another energy, or write your own idea
                below.
              </p>
              <button
                className="text-link"
                onClick={() => {
                  setTime("any");
                  setSetting("any");
                }}
              >
                Clear time & place filters
              </button>
            </>
          )}
        </div>
      </div>
      {notice && (
        <p role="status" className="status result-count">
          {notice}
        </p>
      )}
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
                <div className="plan-links">
                  {p.planned_for && p.status !== "done" && (
                    <button
                      className="text-link"
                      onClick={() => downloadCalendar(p)}
                    >
                      Add to my calendar ↓
                    </button>
                  )}
                  {p.status === "done" && (
                    <button
                      className="text-link"
                      onClick={() => {
                        chooseIdea(p);
                        setDate("");
                        setEnergy(p.energy);
                      }}
                    >
                      Do this again ↻
                    </button>
                  )}
                </div>
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
          {!plans.some((p) => filter === "all" || p.status === filter) && (
            <p className="empty-state">
              {plans.length
                ? "No plans in this view yet."
                : "Start with an idea. You can choose the day later."}
            </p>
          )}
          <div className="section-heading" style={{ marginTop: 45 }}>
            <h2>For when neither of us can decide</h2>
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
            {suggestions.map((i) => (
              <button
                key={i.title}
                onClick={() => {
                  chooseIdea(i);
                }}
              >
                {i.title} <span aria-hidden="true">↗</span>
                <small>{i.note}</small>
              </button>
            ))}
          </div>
        </section>
        <aside className="aside-form">
          <h2>Put a day to it</h2>
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
