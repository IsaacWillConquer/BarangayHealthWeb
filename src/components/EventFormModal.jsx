import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { validEventTypes, validEventStatuses } from "../data/healthEventsConstants";

const emptyForm = {
  title: "",
  eventType: "",
  description: "",
  location: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  status: "Draft",
};

function toFormState(event) {
  if (!event) return emptyForm;
  return {
    title: event.Title || "",
    eventType: event.EventType || "",
    description: event.Description || "",
    location: event.Location || "",
    eventDate: event.EventDate || "",
    startTime: event.StartTime || "",
    endTime: event.EndTime || "",
    status: event.Status || "Draft",
  };
}

export default function EventFormModal({ open, event, onClose, onSubmit }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? "Edit Health Event" : "New Health Event"}
      maxWidth="max-w-xl"
    >
      {open && (
        <EventForm
          key={event?.EventID ?? "new"}
          event={event}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function EventForm({ event, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toFormState(event));
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Event type" required>
          <select
            className={inputClass}
            value={form.eventType}
            onChange={(e) => update("eventType", e.target.value)}
            required
          >
            <option value="">Select…</option>
            {validEventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status" required>
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {validEventStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Location" required>
        <input
          className={inputClass}
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          maxLength={255}
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Event date" required>
          <input
            type="date"
            className={inputClass}
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            required
          />
        </Field>
        <Field label="Start time">
          <input
            type="time"
            className={inputClass}
            value={form.startTime}
            onChange={(e) => update("startTime", e.target.value)}
          />
        </Field>
        <Field label="End time">
          <input
            type="time"
            className={inputClass}
            value={form.endTime}
            onChange={(e) => update("endTime", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={1000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
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
          {saving ? "Saving…" : event ? "Save changes" : "Create event"}
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
