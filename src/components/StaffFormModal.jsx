import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const emptyForm = { firstName: "", lastName: "", email: "", role: "Staff" };

function toFormState(staff) {
  if (!staff) return emptyForm;
  return {
    firstName: staff.FirstName || "",
    lastName: staff.LastName || "",
    email: staff.Email || "",
    role: staff.Role || "Staff",
  };
}

export default function StaffFormModal({ open, staff, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff ? "Edit Staff Account" : "New Staff Account"}
      maxWidth="max-w-md"
    >
      {open && (
        <StaffForm
          key={staff?.StaffID ?? "new"}
          staff={staff}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function StaffForm({ staff, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(staff));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(staff);

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

      <Field label="Email" required>
        <input
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </Field>

      <Field label="Role" required>
        <select
          className={inputClass}
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        >
          <option value="Staff">Staff</option>
          <option value="Admin">Admin</option>
        </select>
      </Field>

      {!isEdit && (
        <p className="text-xs text-stone-500">
          New accounts get the default password <code>StaffPassword</code> and
          must change it on first login.
        </p>
      )}

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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create account"}
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
