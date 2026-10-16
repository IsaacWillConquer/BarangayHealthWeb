import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const emptyForm = { title: "", description: "", openAt: "", closeAt: "" };

function toFormState(survey) {
  if (!survey) return emptyForm;
  return {
    title: survey.Title || "",
    description: survey.Description || "",
    openAt: survey.OpenAt || "",
    closeAt: survey.CloseAt || "",
  };
}

export default function SurveyMetaModal({ open, survey, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={survey ? "Edit Survey Details" : "New Survey"}
      maxWidth="max-w-lg"
    >
      {open && (
        <MetaForm
          key={survey?.SurveyID ?? "new"}
          survey={survey}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function MetaForm({ survey, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(survey));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
      <Field label="Title" required>
        <input
          className={inputClass}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={200}
          required
        />
      </Field>
      <Field label="Description">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={1000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Opens">
          <input
            type="date"
            className={inputClass}
            value={form.openAt}
            onChange={(e) => update("openAt", e.target.value)}
          />
        </Field>
        <Field label="Closes">
          <input
            type="date"
            className={inputClass}
            value={form.closeAt}
            onChange={(e) => update("closeAt", e.target.value)}
          />
        </Field>
      </div>

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
          {saving ? "Saving…" : survey ? "Save changes" : "Create survey"}
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
