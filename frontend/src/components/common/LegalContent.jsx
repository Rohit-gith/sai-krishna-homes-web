/** Renders a list of { heading, body } sections for legal pages. */
export default function LegalContent({ updated, sections }) {
  return (
    <section className="section">
      <div className="container max-w-3xl">
        <p className="mb-10 text-sm text-slate-500">Last updated: {updated}</p>
        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={s.heading}>
              <h2 className="text-xl font-bold">
                {i + 1}. {s.heading}
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
