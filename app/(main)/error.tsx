"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h2>We couldn’t open this page.</h2>
      <p>Your saved entries are still there. Try opening it again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
