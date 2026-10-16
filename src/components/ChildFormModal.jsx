import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const emptyForm = { lastName: "", firstName: "", birthdate: "", gender: "", status: "Living" };

function toFormState(child) {
  if (!child) return emptyForm;
  return {
    lastName: child.LastName || "",
    firstName: child.FirstName || "",
    birthdate: child.Birthdate || "",
    gender: child.Gender || "",
    status: child.Status || "Living",
  };
}

export default function ChildFormModal({ open, child, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={child ? "Edit Child" : "Add Child"}
      maxWidth="max-w-sm"
    >
      {open && (
        <ChildForm
          key={child?.ChildID ?? "new"}
          child={child}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function ChildForm({ child, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(child));
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" required>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
          />
        </Field>
        <Field label="Last name" required>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Birthdate" required>
        <input
          type="date"
          className={inputClass}
          value={form.birthdate}
          onChange={(e) => update("birthdate", e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Gender">
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="Living">Living</option>
            <option value="Deceased">Deceased</option>
          </select>
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
          {saving ? "Saving…" : child ? "Save changes" : "Add child"}
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
