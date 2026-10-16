import Modal from "./ui/Modal";

export default function ResultsModal({ open, survey, results, loading, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={survey ? `Results — ${survey.Title}` : "Results"}
      maxWidth="max-w-lg"
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
      ) : !results || results.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">
          No responses yet.
        </p>
      ) : (
        <div className="space-y-5">
          {results.map((r) => (
            <div key={r.QuestionID}>
              <p className="text-sm font-medium text-stone-800">
                {r.QuestionText}
              </p>
              <p className="mb-2 text-xs text-stone-400">
                {r.totalResponses} response{r.totalResponses === 1 ? "" : "s"}
                {r.Type === "Rating" && r.average != null && ` · avg ${r.average}`}
              </p>

              {r.Type === "ShortAnswer" ? (
                <ul className="space-y-1">
                  {(r.rawAnswers || []).filter(Boolean).map((a, i) => (
                    <li
                      key={i}
                      className="rounded-md bg-stone-50 px-3 py-1.5 text-sm text-stone-600"
                    >
                      {a}
                    </li>
                  ))}
                  {(r.rawAnswers || []).filter(Boolean).length === 0 && (
                    <li className="text-sm text-stone-400">No answers given.</li>
                  )}
                </ul>
              ) : (
                <div className="space-y-1.5">
                  {r.tally.map(({ value, count }) => {
                    const pct = r.totalResponses
                      ? Math.round((count / r.totalResponses) * 100)
                      : 0;
                    return (
                      <div key={value} className="flex items-center gap-2 text-sm">
                        <span className="w-20 shrink-0 text-stone-600">{value}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right text-stone-500">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
