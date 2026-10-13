"use client";
import { useState } from "react";
import Link from "next/link";
import { ActionForm } from "./ActionForm";
import { saveCheckin } from "@/app/actions/journal";
import { PageHeading } from "./PageHeading";
import { dateLabel } from "@/lib/validation";
export type CheckinEntry = {
  id: string;
  user_id: string;
  mood: string;
  energy: string;
  need: string;
  phase: string;
  cycle_phase: string | null;
  note: string;
  created_at: string;
};
export function Checkin({
  entries,
  partnerName,
  privateEntries = [],
  names = {},
}: {
  entries: CheckinEntry[];
  partnerName: string;
  privateEntries?: { id: string; cycle_phase: string | null; note: string }[];
  names?: Record<string, string>;
}) {
  const [mood, setMood] = useState(""),
    [cycle, setCycle] = useState(""),
    [energy, setEnergy] = useState("gentle");
  const care =
    energy === "gentle"
      ? {
          title: "Room to slow down.",
          note: "A quiet dinner, a familiar film, or simply sitting together. Ask what feels good today.",
        }
      : energy === "steady"
        ? {
            title: "A little change of scene.",
            note: "A walk, a bookshop, or cooking something new together. Make space to talk without a rush.",
          }
        : {
            title: "Follow the curiosity.",
            note: "Try somewhere neither of you has been. Choose an adventure together, and leave room to change your mind.",
          };
  return (
    <>
      <PageHeading
        number="03"
        title="How are you, really?"
        description={`Let ${partnerName} know how today feels. Share only what you want to share.`}
      />
      <div className="checkin-layout">
        <div className="form-panel">
          <ActionForm action={saveCheckin}>
            <div>
              <label htmlFor="mood">Today, I feel</label>
              <div className="chips" style={{ marginBottom: 12 }}>
                {[
                  "Tender",
                  "Content",
                  "Playful",
                  "Overwhelmed",
                  "Quiet",
                  "Hopeful",
                ].map((x) => (
                  <button
                    key={x}
                    type="button"
                    aria-pressed={mood === x}
                    onClick={() => setMood(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <input
                id="mood"
                name="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Or put it in your own words"
                maxLength={80}
                required
              />
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="energy">My energy</label>
                <select
                  id="energy"
                  name="energy"
                  value={energy}
                  onChange={(e) => setEnergy(e.target.value)}
                >
                  <option value="gentle">I need a gentle day</option>
                  <option value="steady">Steady</option>
                  <option value="adventurous">Up for an adventure</option>
                </select>
              </div>
              <div>
                <label htmlFor="phase">The season I’m in</label>
                <input
                  id="phase"
                  name="phase"
                  placeholder="Finding my feet, deep focus…"
                  maxLength={200}
                />
              </div>
            </div>
            <div>
              <label htmlFor="need">What I’d love from you</label>
              <input
                id="need"
                name="need"
                placeholder="A little reassurance, a walk, some space…"
                maxLength={500}
              />
            </div>
            <details>
              <summary className="text-link">Optional cycle check-in +</summary>
              <div style={{ marginTop: 16 }}>
                <label htmlFor="cycle">My cycle phase</label>
                <select
                  id="cycle"
                  name="cycle_phase"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                >
                  <option value="">Leave blank</option>
                  {[
                    "Menstrual",
                    "Follicular",
                    "Ovulatory",
                    "Luteal",
                    "Not sure",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <label className="check-row">
                  <input type="checkbox" name="share_cycle" />
                  Share my cycle phase with {partnerName}
                </label>
                <p className="subtitle" style={{ fontSize: 14 }}>
                  Only what you choose to record. Private unless you share it.
                </p>
              </div>
            </details>
            <div>
              <label htmlFor="note">Anything else on your mind?</label>
              <textarea
                id="note"
                name="note"
                rows={4}
                maxLength={5000}
                placeholder="You can keep this just for yourself."
              />
              <label className="check-row">
                <input type="checkbox" name="share_note" />
                Share this reflection with {partnerName}
              </label>
            </div>
            <div className="form-actions">
              <span className="eyebrow">A SMALL MOMENT OF HONESTY</span>
              <button className="button">Save check-in ↗</button>
            </div>
          </ActionForm>
        </div>
        <aside>
          <section className="care-compass" aria-live="polite">
            <span className="compass-symbol" aria-hidden="true">
              ☼
            </span>
            <p className="eyebrow">A LITTLE CARE / YOUR ENERGY TODAY</p>
            <h2>{care.title}</h2>
            <p>{care.note}</p>
            <Link href={`/together?energy=${energy}`} className="text-link">
              Find a plan for this energy ↗
            </Link>
          </section>
          <div className="section-heading">
            <h2>Recent check-ins</h2>
          </div>
          {entries.length === 0 && (
            <p className="empty-state">
              Your first check-in can be as simple as one word.
            </p>
          )}
          {entries.map((e) => {
            const own = privateEntries.find((p) => p.id === e.id);
            return (
              <article className="side-note" key={e.id}>
                <p className="eyebrow">
                  {names[e.user_id] || "Your person"} ·{" "}
                  {dateLabel(e.created_at)}
                </p>
                <h3>{e.mood}</h3>
                <p>
                  {e.energy}
                  {e.phase && ` · ${e.phase}`}
                </p>
                {e.need && <p style={{ marginTop: 10 }}>“{e.need}”</p>}
                {e.cycle_phase && (
                  <p style={{ marginTop: 10 }}>
                    Cycle: {e.cycle_phase} · shared
                  </p>
                )}
                {e.note && <p style={{ marginTop: 10 }}>{e.note}</p>}
                {own && (own.note || own.cycle_phase) && (
                  <details>
                    <summary className="text-link">
                      Your private reflection
                    </summary>
                    {own.cycle_phase && <p>Cycle: {own.cycle_phase}</p>}
                    <p>{own.note}</p>
                  </details>
                )}
              </article>
            );
          })}
        </aside>
      </div>
    </>
  );
}
