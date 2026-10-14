import { validDate } from "./validation";

export function wordCount(body: string) {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

// All-day events keep the chosen date on either person's calendar, regardless of timezone.
export function calendarEvent(
  plan: { id: string; title: string; note: string; planned_for: string | null },
  now = new Date(),
) {
  if (!plan.planned_for || !validDate(plan.planned_for))
    throw new Error("Choose a day first.");
  const day = new Date(`${plan.planned_for}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Letters//Our plans//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escape(plan.id)}@lettersforus.vercel.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${plan.planned_for.replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${day.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${escape(plan.title)}`,
    `DESCRIPTION:${escape(plan.note)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const encoder = new TextEncoder();
  return (
    lines
      .map((line) => {
        let folded = "",
          bytes = 0;
        for (const char of line) {
          const size = encoder.encode(char).length;
          if (bytes + size > 75) {
            folded += "\r\n ";
            bytes = 1;
          }
          folded += char;
          bytes += size;
        }
        return folded;
      })
      .join("\r\n") + "\r\n"
  );
}
