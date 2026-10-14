import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarEvent } from "../lib/journal-tools";

test("calendar export preserves dates across month boundaries and escapes event text", () => {
  const text = calendarEvent(
    {
      id: "plan-1",
      title: "Dinner, then tea; yes",
      note: "First line\nSecond line\\home",
      planned_for: "2028-02-29",
    },
    new Date("2026-10-14T00:00:00Z"),
  );
  assert.match(
    text,
    /DTSTART;VALUE=DATE:20280229\r\nDTEND;VALUE=DATE:20280301/,
  );
  assert.ok(text.includes("SUMMARY:Dinner\\, then tea\\; yes"));
  assert.ok(text.includes("DESCRIPTION:First line\\nSecond line\\\\home"));
  assert.throws(() =>
    calendarEvent({
      id: "1",
      title: "Date",
      note: "",
      planned_for: "2026-02-30",
    }),
  );
  assert.throws(() =>
    calendarEvent({ id: "1", title: "Date", note: "", planned_for: null }),
  );
});

test("calendar export folds Unicode safely and prevents newline property injection", () => {
  const title = "☕".repeat(50) + "\r\nATTENDEE:someone";
  const text = calendarEvent({
    id: "1",
    title,
    note: "",
    planned_for: "2026-12-31",
  });
  for (const line of text.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(
    text
      .replace(/\r\n /g, "")
      .includes(`SUMMARY:${"☕".repeat(50)}\\nATTENDEE:someone`),
  );
  assert.ok(!text.includes("\r\nATTENDEE:"));
  assert.ok(text.includes("DTEND;VALUE=DATE:20270101"));
});
