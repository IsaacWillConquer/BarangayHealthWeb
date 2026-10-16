import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const emptyForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  extensionName: "",
  civilStatus: "",
  gender: "",
  birthday: "",
  address: "",
  address2: "",
  email: "",
  contactNumber: "",
  homePhone: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactNumber: "",
};

const PHONE_MAX = 11;

function phoneProps(value, onChange, required = false) {
  return {
    type: "tel",
    inputMode: "numeric",
    maxLength: PHONE_MAX,
    pattern: "[0-9]*",
    className: inputClass,
    value,
    onChange: (e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PHONE_MAX)),
    placeholder: `${PHONE_MAX} digits`,
    required,
  };
}

function toFormState(resident) {
  if (!resident) return emptyForm;
  return {
    firstName: resident.FirstName || "",
    middleName: resident.MiddleName || "",
    lastName: resident.LastName || "",
    extensionName: resident.ExtensionName || "",
    civilStatus: resident.CivilStatus || "",
    gender: resident.Gender || "",
    birthday: resident.Birthday || "",
    address: resident.Address || "",
    address2: resident.Address2 || "",
    email: resident.Email || "",
    contactNumber: resident.ContactNumber || "",
    homePhone: resident.HomePhone || "",
    emergencyContactName: resident.EmergencyContactName || "",
    emergencyContactRelationship: resident.EmergencyContactRelationship || "",
    emergencyContactNumber: resident.EmergencyContactNumber || "",
  };
}

export default function ResidentFormModal({ open, resident, onClose, onSubmit, readOnly = false }) {
  const title = readOnly
    ? "Resident Details"
    : resident
      ? "Edit Resident"
      : "New Resident";

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-2xl">
      {open && (
        <ResidentForm
          key={resident?.ResidentID ?? "new"}
          resident={resident}
          onClose={onClose}
          onSubmit={onSubmit}
          readOnly={readOnly}
        />
      )}
    </Modal>
  );
}

function ResidentForm({ resident, onClose, onSubmit, readOnly = false }) {
  const [form, setForm] = useState(() => toFormState(resident));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(resident);

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
      <fieldset disabled={readOnly} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <input
              className={inputClass}
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
          </Field>
          <Field label="Middle name">
            <input
              className={inputClass}
              value={form.middleName}
              onChange={(e) => update("middleName", e.target.value)}
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
          <Field label="Extension (Jr., III, etc.)">
            <input
              className={inputClass}
              value={form.extensionName}
              onChange={(e) => update("extensionName", e.target.value)}
            />
          </Field>

          <Field label="Civil status" required>
            <select
              className={inputClass}
              value={form.civilStatus}
              onChange={(e) => update("civilStatus", e.target.value)}
              required
              disabled={readOnly}
            >
              <option value="">Select…</option>
              {["Single", "Married", "Widowed", "Separated", "Divorced"].map(
                (v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                )
              )}
            </select>
          </Field>
          <Field label="Gender" required>
            <select
              className={inputClass}
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              required
              disabled={readOnly}
            >
              <option value="">Select…</option>
              {["Male", "Female", "Other"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Birthday" required>
            <input
              type="date"
              className={inputClass}
              value={form.birthday}
              onChange={(e) => update("birthday", e.target.value)}
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>

          <Field label="Address" required className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              required
            />
          </Field>
          <Field label="Address line 2" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.address2}
              onChange={(e) => update("address2", e.target.value)}
            />
          </Field>

          <Field label="Contact number" required>
            <input
              {...phoneProps(form.contactNumber, (v) => update("contactNumber", v), true)}
            />
          </Field>
          <Field label="Home phone">
            <input
              {...phoneProps(form.homePhone, (v) => update("homePhone", v))}
            />
          </Field>
        </div>

        <fieldset className="rounded-md border border-stone-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Emergency contact
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" required>
              <input
                className={inputClass}
                value={form.emergencyContactName}
                onChange={(e) => update("emergencyContactName", e.target.value)}
                required
              />
            </Field>
            <Field label="Relationship" required>
              <input
                className={inputClass}
                value={form.emergencyContactRelationship}
                onChange={(e) =>
                  update("emergencyContactRelationship", e.target.value)
                }
                required
              />
            </Field>
            <Field label="Number" required>
              <input
                {...phoneProps(form.emergencyContactNumber, (v) =>
                  update("emergencyContactNumber", v)
                , true)}
              />
            </Field>
          </div>
        </fieldset>
      </fieldset>

      {readOnly && resident?.ResidentNumber && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="font-semibold">Resident Number: </span>
          {resident.ResidentNumber}
          <span className="block text-xs text-emerald-700">
            This is also the temporary password. The resident must change it after
            their first sign in.
          </span>
        </div>
      )}

      {readOnly && resident?.RejectionReason && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="font-semibold">Rejection reason: </span>
          {resident.RejectionReason}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {readOnly ? (
          <Button type="button" variant="neutral" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="neutral" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create resident"}
            </Button>
          </>
        )}
      </div>
      </form>
  );
}

const inputClass =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function Field({ label, required, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-stone-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
