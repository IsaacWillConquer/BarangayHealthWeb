import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { validConditions, validStatuses } from "../data/healthHistoryConstants";

const emptyForm = {
  conditionType: "",
  otherConditionText: "",
  recordDate: "",
  status: "Ongoing",
  notes: "",
};

function toFormState(record) {
  if (!record) return emptyForm;
  return {
    conditionType: record.ConditionType || "",
    otherConditionText: record.OtherConditionText || "",
    recordDate: record.RecordDate || "",
    status: record.Status || "Ongoing",
    notes: record.Notes || "",
  };
}

export default function HealthHistoryFormModal({ open, record, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Edit Health Record" : "Add Health Record"}
      maxWidth="max-w-lg"
    >
      {open && (
        <RecordForm
          key={record?.RecordID ?? "new"}
          record={record}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function RecordForm({ record, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(record));
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
      <Field label="Condition" required>
        <select
          className={inputClass}
          value={form.conditionType}
          onChange={(e) => update("conditionType", e.target.value)}
          required
        >
          <option value="">Select…</option>
          {validConditions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      {form.conditionType === "Other" && (
        <Field label="Specify condition" required>
          <input
            className={inputClass}
            value={form.otherConditionText}
            onChange={(e) => update("otherConditionText", e.target.value)}
            required
          />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Record date" required>
          <input
            type="date"
            className={inputClass}
            value={form.recordDate}
            onChange={(e) => update("recordDate", e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>
        <Field label="Status" required>
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {validStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

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
          {saving ? "Saving…" : record ? "Save changes" : "Add record"}
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
