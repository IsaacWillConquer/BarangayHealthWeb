import { useState } from "react";
import Button from "./ui/Button";

export default function SurveyAnswerForm({ survey, onSubmit, onCancel }) {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setAnswer(questionId, patch) {
    setAnswers((a) => ({ ...a, [questionId]: { questionId, ...a[questionId], ...patch } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await onSubmit(Object.values(answers));
      if (!res.success) setError(res.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {survey.questions.map((q, i) => (
        <div key={q.QuestionID} className="rounded-lg bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-stone-800">
            <span className="text-stone-400">{i + 1}.</span> {q.QuestionText}
            {q.IsRequired && <span className="text-red-500"> *</span>}
          </p>

          {q.Type === "MultipleChoice" && (
            <div className="space-y-2">
              {q.Choices.map((c) => (
                <label key={c.ChoiceID} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name={q.QuestionID}
                    checked={answers[q.QuestionID]?.choiceId === c.ChoiceID}
                    onChange={() =>
                      setAnswer(q.QuestionID, { choiceId: c.ChoiceID, answerText: c.ChoiceText })
                    }
                  />
                  {c.ChoiceText}
                </label>
              ))}
            </div>
          )}

          {q.Type === "YesNo" && (
            <div className="flex gap-4">
              {["Yes", "No"].map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name={q.QuestionID}
                    checked={answers[q.QuestionID]?.answerText === v}
                    onChange={() => setAnswer(q.QuestionID, { answerText: v })}
                  />
                  {v}
                </label>
              ))}
            </div>
          )}

          {q.Type === "Rating" && (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                { length: Math.floor((q.RatingMax - q.RatingMin) / (q.RatingStep || 1)) + 1 },
                (_, idx) => q.RatingMin + idx * (q.RatingStep || 1)
              ).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAnswer(q.QuestionID, { ratingValue: v })}
                  className={`h-9 w-9 rounded-md border text-sm font-medium ${
                    answers[q.QuestionID]?.ratingValue === v
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-stone-300 text-stone-600 hover:border-emerald-600"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {q.Type === "ShortAnswer" && (
            <textarea
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              rows={3}
              maxLength={1000}
              value={answers[q.QuestionID]?.answerText || ""}
              onChange={(e) => setAnswer(q.QuestionID, { answerText: e.target.value })}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="neutral" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit response"}
        </Button>
      </div>
    </form>
  );
}
