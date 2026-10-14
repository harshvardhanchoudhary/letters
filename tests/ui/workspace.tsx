// Synthetic fixtures for isolated browser tests. Never imported by the app.
import { createRoot } from "react-dom/client";
import { Home } from "../../components/Home";
import { LetterWriter } from "../../components/LetterWriter";
import { Library } from "../../components/Library";
import { Checkin } from "../../components/Checkin";
import { Together } from "../../components/Together";
import Letters from "../../app/(main)/letters/LettersListClient";
import Timeline from "../../app/(main)/timeline/TimelineClient";
const letter = {
  id: "one",
  subject: "First envelope",
  body: "A synthetic letter about a bookshop.",
  sent_at: "2026-03-01T12:00:00Z",
  read_at: null,
  from_id: "partner",
  to_id: "me",
  created_at: "2026-03-01T12:00:00Z",
};
const letters = [
  letter,
  {
    ...letter,
    id: "two",
    subject: "Second envelope",
    sent_at: "2026-04-01T12:00:00Z",
  },
];
const items = [
  {
    id: "book",
    title: "Fixture book",
    author: "Test author",
    kind: "book",
    user_id: "partner",
    url: null,
    progress: 35,
    status: "reading",
  },
  {
    id: "article",
    title: "Fixture article",
    author: "Test author",
    kind: "article",
    user_id: "me",
    url: "https://example.com/article",
    progress: 0,
    status: "want",
  },
];
const notes = [
  {
    id: "n1",
    item_id: "book",
    user_id: "partner",
    body: "Shared question about this book",
    is_private: false,
    created_at: letter.sent_at,
  },
  {
    id: "n2",
    item_id: "article",
    user_id: "me",
    body: "Private marginalia",
    is_private: true,
    created_at: letter.sent_at,
  },
];
const page = new URLSearchParams(location.search).get("page");
const content =
  page === "letters" ? (
    <Letters letters={letters} userId="me" partnerName="Partner" />
  ) : page === "writer" ? (
    <LetterWriter
      partnerName="Partner"
      draft={{ id: "draft", subject: "Unfinished", body: "Keep these words." }}
    />
  ) : page === "library" ? (
    <Library items={items} notes={notes} userId="me" partnerName="Partner" />
  ) : page === "mood" ? (
    <Checkin
      entries={[
        {
          id: "c1",
          user_id: "me",
          mood: "Content",
          energy: "gentle",
          need: "A hug",
          phase: "",
          note: "",
          cycle_phase: null,
          created_at: letter.sent_at,
        },
      ]}
      partnerName="Partner"
      names={{ me: "You", partner: "Partner" }}
    />
  ) : page === "together" ? (
    <Together
      partnerName="Partner"
      userId="me"
      plans={[
        {
          id: "p1",
          title: "Our planned day",
          note: "Bring lunch",
          energy: "steady",
          planned_for: "2027-01-02",
          status: "planned",
          user_id: "me",
        },
        {
          id: "p2",
          title: "A day to repeat",
          note: "Bring a book",
          energy: "gentle",
          planned_for: "2026-03-01",
          status: "done",
          user_id: "partner",
        },
      ]}
    />
  ) : page === "timeline" ? (
    <Timeline
      userId="me"
      entries={[
        ...letters.map((l) => ({ ...l, kind: "letter" as const })),
        {
          ...letter,
          kind: "postcard",
          id: "photo",
          image_url:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect fill='%23cbd1b0' width='800' height='500'/%3E%3C/svg%3E",
          caption: "Fixture photograph",
        },
      ]}
    />
  ) : (
    <Home
      data={{
        myName: "You",
        partnerName: "Partner",
        unread: letter,
        unreadCount: 2,
        letterCount: 2,
        firstLetterDate: letter.sent_at,
        draft: { subject: "Unfinished", updated_at: letter.sent_at },
        mood: null,
        plan: null,
        book: null,
        photo: null,
      }}
    />
  );
createRoot(document.getElementById("root")!).render(
  <div className="journal-shell">
    <header className="masthead">Letters</header>
    <nav className="journal-nav" aria-label="Journal">
      <a href="?page=home">Home</a>
    </nav>
    <main className="journal-main">{content}</main>
  </div>,
);
