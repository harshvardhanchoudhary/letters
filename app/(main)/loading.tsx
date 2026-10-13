export default function Loading() {
  return (
    <div role="status" aria-label="Opening your journal">
      <p className="eyebrow">OPENING YOUR JOURNAL</p>
      <div className="loading-line" />
      <div className="loading-line" style={{ width: "60%" }} />
    </div>
  );
}
