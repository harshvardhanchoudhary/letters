import { test } from "node:test";
import assert from "node:assert/strict";
import { safeUrl, validDate, uuid, text } from "../lib/validation";
import { isAllowedEmail } from "../lib/access";
test("saved discussion links reject executable URLs and embedded credentials", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "https://user:pass@example.com/",
    "not a url",
  ])
    assert.throws(() => safeUrl(value));
  assert.equal(
    safeUrl("https://www.youtube.com/watch?v=abc"),
    "https://www.youtube.com/watch?v=abc",
  );
  assert.equal(safeUrl(""), null);
});
test("calendar dates reject rollovers and invalid input", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-13-01"), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2026-10-18"), true);
  assert.equal(validDate("tomorrow"), false);
});
test("access control fails closed and normalizes only configured emails", () => {
  const a = process.env.ALLOWED_EMAIL_1,
    b = process.env.ALLOWED_EMAIL_2;
  try {
    process.env.ALLOWED_EMAIL_1 = "one@example.com";
    process.env.ALLOWED_EMAIL_2 = "two@example.com";
    assert.equal(isAllowedEmail(" ONE@example.com "), true);
    assert.equal(isAllowedEmail("outsider@example.com"), false);
    delete process.env.ALLOWED_EMAIL_2;
    assert.equal(isAllowedEmail("one@example.com"), false);
  } finally {
    if (a) process.env.ALLOWED_EMAIL_1 = a;
    else delete process.env.ALLOWED_EMAIL_1;
    if (b) process.env.ALLOWED_EMAIL_2 = b;
    else delete process.env.ALLOWED_EMAIL_2;
  }
});
test("form inputs are bounded and ignore file objects", () => {
  const f = new FormData();
  f.set("title", "  hello world  ");
  assert.equal(text(f, "title", 5), "hello");
  f.set("title", new Blob(["a"]), "a.txt");
  assert.equal(text(f, "title"), "");
  assert.equal(uuid("not-an-id"), false);
  assert.equal(uuid("12345678-1234-4234-8234-123456789012"), true);
});
