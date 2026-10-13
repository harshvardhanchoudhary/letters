"use client";
import { useState } from "react";
import type { Plan } from "./Together";
export function PlanCalendar({
  plans,
  onChoose,
}: {
  plans: Plan[];
  onChoose: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const next = plans.find(
      (p) => p.planned_for && p.status === "planned",
    )?.planned_for;
    const d = next ? new Date(next + "T12:00:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState("");
  const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const offset = (month.getDay() + 6) % 7,
    days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <section className="plan-calendar" aria-label="Shared calendar">
      <div className="calendar-heading">
        <h2>
          {month.toLocaleDateString("en-AU", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div>
          <button
            aria-label="Previous month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            ←
          </button>
          <button
            aria-label="Next month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            →
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="day-label">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${prefix}-${String(i + 1).padStart(2, "0")}`;
          const count = plans.filter(
            (p) => p.planned_for === date && p.status !== "idea",
          ).length;
          return (
            <button
              key={date}
              aria-label={`${date}${count ? `, ${count} plans` : ""}`}
              aria-pressed={selected === date}
              className={count ? "has-plan" : ""}
              onClick={() => {
                setSelected(date);
                onChoose(date);
              }}
            >
              {i + 1}
              {count > 0 && <i />}
            </button>
          );
        })}
      </div>
      <p className="calendar-help" aria-live="polite">
        {selected
          ? `Selected ${selected}. Add your plan using the form.`
          : "Choose a day to start a plan. Dots mark your shared plans."}
      </p>
      {selected &&
        plans
          .filter((p) => p.planned_for === selected)
          .map((p) => (
            <p className="calendar-plan" key={p.id}>
              {p.title} · {p.status}
            </p>
          ))}
    </section>
  );
}
