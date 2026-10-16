import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { validQuestionTypes } from "../data/surveyConstants";

function toFormState(question) {
  if (!question) {
    return {
      questionText: "",
      type: "ShortAnswer",
      isRequired: true,
      choices: ["", ""],
      ratingMin: 1,
      ratingMax: 5,
      ratingStep: 1,
    };
  }
  return {
    questionText: question.QuestionText || "",
    type: question.Type,
    isRequired: question.IsRequired,
    choices: question.Choices?.length
      ? question.Choices.map((c) => c.ChoiceText)
      : ["", ""],
    ratingMin: question.RatingMin ?? 1,
    ratingMax: question.RatingMax ?? 5,
    ratingStep: question.RatingStep ?? 1,
  };
}

export default function QuestionFormModal({ open, question, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={question ? "Edit Question" : "Add Question"}
      maxWidth="max-w-lg"
    >
      {open && (
        <QuestionForm
          key={question?.QuestionID ?? "new"}
          question={question}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function QuestionForm({ question, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(question));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateChoice(i, value) {
    setForm((f) => {
      const choices = [...f.choices];
      choices[i] = value;
      return { ...f, choices };
    });
  }

  function addChoice() {
    setForm((f) => ({ ...f, choices: [...f.choices, ""] }));
  }

  function removeChoice(i) {
    setForm((f) => ({ ...f, choices: f.choices.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await onSubmit(form);
      if (!res.success) setError(res.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Question text" required>
        <textarea
          className={inputClass}
          rows={2}
          maxLength={500}
          value={form.questionText}
          onChange={(e) => update("questionText", e.target.value)}
          required
        />
      </Field>

      <Field label="Answer type" required>
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
        >
          {validQuestionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      {form.type === "MultipleChoice" && (
        <div>
          <span className="mb-1 block text-sm font-medium text-stone-700">
            Choices <span className="text-red-500">*</span>
          </span>
          <div className="space-y-2">
            {form.choices.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={inputClass}
                  value={c}
                  maxLength={255}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                />
                {form.choices.length > 2 && (
                  <Button
                    type="button"
                    variant="neutral"
                    onClick={() => removeChoice(i)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="neutral"
            className="mt-2"
            onClick={addChoice}
          >
            + Add choice
          </Button>
        </div>
      )}

      {form.type === "Rating" && (
        <div className="grid grid-cols-3 gap-4">
          <Field label="Min">
            <input
              type="number"
              className={inputClass}
              value={form.ratingMin}
              onChange={(e) => update("ratingMin", e.target.value)}
            />
          </Field>
          <Field label="Max">
            <input
              type="number"
              className={inputClass}
              value={form.ratingMax}
              onChange={(e) => update("ratingMax", e.target.value)}
            />
          </Field>
          <Field label="Step">
            <input
              type="number"
              className={inputClass}
              value={form.ratingStep}
              onChange={(e) => update("ratingStep", e.target.value)}
            />
          </Field>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={form.isRequired}
          onChange={(e) => update("isRequired", e.target.checked)}
        />
        Required
      </label>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="neutral" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : question ? "Save changes" : "Add question"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-stone-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
