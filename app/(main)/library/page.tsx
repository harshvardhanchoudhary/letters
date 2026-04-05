export default function LibraryPage() {
  return (
    <div>
      <h1 className="font-garamond text-3xl text-ink">Library</h1>
      <p className="mt-2 font-garamond text-sm italic text-ink-faint">
        Your reading ritual lives here. We will add progress, quotes, and notes next.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-paper p-5">
        <p className="font-garamond text-xs italic text-ink-faint">Current implementation status</p>
        <p className="mt-2 font-garamond text-ink">
          This tab is scaffolded for the mobile flow and information architecture. Data model + input flows are next.
        </p>
      </div>
    </div>
  )
}
