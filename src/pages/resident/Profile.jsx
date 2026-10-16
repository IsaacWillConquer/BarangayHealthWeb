import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ImageUploadModal from "../../components/ImageUploadModal";
import ChildFormModal from "../../components/ChildFormModal";
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadSignatureImage,
  addChild,
  updateChild,
  deleteChild,
} from "../../api/profileLocal";

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

function toFormState(profile) {
  return {
    middleName: profile.MiddleName || "",
    extensionName: profile.ExtensionName || "",
    civilStatus: profile.CivilStatus || "",
    gender: profile.Gender || "",
    birthday: profile.Birthday || "",
    address: profile.Address || "",
    address2: profile.Address2 || "",
    email: profile.Email || "",
    contactNumber: profile.ContactNumber || "",
    homePhone: profile.HomePhone || "",
    emergencyContactName: profile.EmergencyContactName || "",
    emergencyContactRelationship: profile.EmergencyContactRelationship || "",
    emergencyContactNumber: profile.EmergencyContactNumber || "",
    bio: profile.Bio || "",
    occupation: profile.Occupation || "",
    occupationLocation: profile.OccupationLocation || "",
    fatherName: profile.FatherName || "",
    motherName: profile.MotherName || "",
    reference1Name: profile.Reference1Name || "",
    reference1Contact: profile.Reference1Contact || "",
    reference2Name: profile.Reference2Name || "",
    reference2Contact: profile.Reference2Contact || "",
    spouseName: profile.spouse?.Name || "",
    spouseBirthdate: profile.spouse?.Birthdate || "",
    spouseCivilStatus: profile.spouse?.CivilStatus || "",
    spouseStatus: profile.spouse?.Status || "Alive",
  };
}

const childColumns = [
  {
    key: "Name",
    label: "Name",
    render: (c) => `${c.FirstName} ${c.LastName}`,
  },
  { key: "Birthdate", label: "Birthdate" },
  { key: "Age", label: "Age" },
  { key: "Status", label: "Status" },
];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const [childFormOpen, setChildFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [deletingChild, setDeletingChild] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    const res = await getProfile();
    if (res.success) {
      setProfile(res.profile);
      setForm(toFormState(res.profile));
    }
    setLoading(false);
  }

  useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSavedNote(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await updateProfile(form);
      if (!res.success) {
        setError(res.message || "Something went wrong.");
      } else {
        await load();
        setSavedNote(true);
      }
    } finally {
      setSaving(false);
    }
  }

  function openAddChild() {
    setEditingChild(null);
    setChildFormOpen(true);
  }

  function openEditChild(child) {
    setEditingChild(child);
    setChildFormOpen(true);
  }

  async function handleChildSubmit(fields) {
    const res = editingChild
      ? await updateChild(editingChild.ChildID, fields)
      : await addChild(fields);
    if (res.success) {
      setChildFormOpen(false);
      await load();
    }
    return res;
  }

  async function handleDeleteChild() {
    setDeleteLoading(true);
    try {
      const res = await deleteChild(deletingChild.ChildID);
      if (res.success) {
        await load();
        setDeletingChild(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading || !profile) {
    return <p className="py-8 text-center text-sm text-stone-500">Loading profile…</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">My Profile</h1>

      <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <img
          src={profile.ProfileImagePath || "https://placehold.co/96x96?text=%20"}
          alt=""
          className="h-24 w-24 shrink-0 rounded-full border border-stone-200 object-cover"
        />
        <div className="flex-1">
          <p className="text-lg font-bold text-stone-900">
            {profile.FirstName} {profile.MiddleName} {profile.LastName} {profile.ExtensionName}
          </p>
          <p className="text-sm text-stone-500">
            {profile.ResidentNumber} · {profile.age != null ? `${profile.age} years old` : ""}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Name changes go through Staff — this form covers everything else.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="neutral" onClick={() => setPhotoOpen(true)}>
            Change Photo
          </Button>
          <Button variant="neutral" onClick={() => setSignatureOpen(true)}>
            {profile.SignatureImagePath ? "Update Signature" : "Add Signature"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="rounded-lg bg-white p-5 shadow-sm">
          <legend className="px-1 text-sm font-bold uppercase tracking-wide text-stone-500">
            Personal Info
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Middle name">
              <input className={inputClass} value={form.middleName} onChange={(e) => update("middleName", e.target.value)} />
            </Field>
            <Field label="Extension (Jr., III, etc.)">
              <input className={inputClass} value={form.extensionName} onChange={(e) => update("extensionName", e.target.value)} />
            </Field>
            <Field label="Civil status" required>
              <select className={inputClass} value={form.civilStatus} onChange={(e) => update("civilStatus", e.target.value)} required>
                <option value="">Select…</option>
                {["Single", "Married", "Widowed", "Separated", "Divorced"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Gender" required>
              <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
                <option value="">Select…</option>
                {["Male", "Female", "Other"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Birthday" required>
              <input type="date" className={inputClass} value={form.birthday} onChange={(e) => update("birthday", e.target.value)} required />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field label="Address" required className="sm:col-span-2">
              <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} required />
            </Field>
            <Field label="Address line 2" className="sm:col-span-2">
              <input className={inputClass} value={form.address2} onChange={(e) => update("address2", e.target.value)} />
            </Field>
            <Field label="Contact number" required>
              <input {...phoneProps(form.contactNumber, (v) => update("contactNumber", v), true)} />
            </Field>
            <Field label="Home phone">
              <input {...phoneProps(form.homePhone, (v) => update("homePhone", v))} />
            </Field>
            <Field label="Bio" className="sm:col-span-2">
              <textarea className={inputClass} rows={2} maxLength={1000} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-lg bg-white p-5 shadow-sm">
          <legend className="px-1 text-sm font-bold uppercase tracking-wide text-stone-500">
            Emergency Contact
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" required>
              <input className={inputClass} value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} required />
            </Field>
            <Field label="Relationship" required>
              <input className={inputClass} value={form.emergencyContactRelationship} onChange={(e) => update("emergencyContactRelationship", e.target.value)} required />
            </Field>
            <Field label="Number" required>
              <input {...phoneProps(form.emergencyContactNumber, (v) => update("emergencyContactNumber", v), true)} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-lg bg-white p-5 shadow-sm">
          <legend className="px-1 text-sm font-bold uppercase tracking-wide text-stone-500">
            Work & Family (optional)
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Occupation">
              <input className={inputClass} value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
            </Field>
            <Field label="Occupation location">
              <input className={inputClass} value={form.occupationLocation} onChange={(e) => update("occupationLocation", e.target.value)} />
            </Field>
            <Field label="Father's name">
              <input className={inputClass} value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} />
            </Field>
            <Field label="Mother's name">
              <input className={inputClass} value={form.motherName} onChange={(e) => update("motherName", e.target.value)} />
            </Field>
            <Field label="Reference 1 name">
              <input className={inputClass} value={form.reference1Name} onChange={(e) => update("reference1Name", e.target.value)} />
            </Field>
            <Field label="Reference 1 contact">
              <input className={inputClass} value={form.reference1Contact} onChange={(e) => update("reference1Contact", e.target.value)} placeholder="11 digits" />
            </Field>
            <Field label="Reference 2 name">
              <input className={inputClass} value={form.reference2Name} onChange={(e) => update("reference2Name", e.target.value)} />
            </Field>
            <Field label="Reference 2 contact">
              <input className={inputClass} value={form.reference2Contact} onChange={(e) => update("reference2Contact", e.target.value)} placeholder="11 digits" />
            </Field>
          </div>
        </fieldset>

        {form.civilStatus === "Married" && (
          <fieldset className="rounded-lg bg-white p-5 shadow-sm">
            <legend className="px-1 text-sm font-bold uppercase tracking-wide text-stone-500">
              Spouse
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input className={inputClass} value={form.spouseName} onChange={(e) => update("spouseName", e.target.value)} required />
              </Field>
              <Field label="Birthdate">
                <input type="date" className={inputClass} value={form.spouseBirthdate} onChange={(e) => update("spouseBirthdate", e.target.value)} />
              </Field>
              <Field label="Civil status">
                <input className={inputClass} value={form.spouseCivilStatus} onChange={(e) => update("spouseCivilStatus", e.target.value)} />
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.spouseStatus} onChange={(e) => update("spouseStatus", e.target.value)}>
                  <option value="Alive">Alive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </Field>
            </div>
          </fieldset>
        )}

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          {savedNote && <span className="text-sm text-emerald-700">Saved.</span>}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Children
          </h2>
          <Button onClick={openAddChild}>+ Add Child</Button>
        </div>
        <DataTable
          columns={childColumns}
          rows={profile.children.map((c) => ({ id: c.ChildID, ...c }))}
          emptyMessage="No children on record."
          renderActions={(c) => (
            <>
              <Button variant="primary" onClick={() => openEditChild(c)}>
                Edit
              </Button>
              <Button variant="dangerSolid" onClick={() => setDeletingChild(c)}>
                Delete
              </Button>
            </>
          )}
        />
      </div>

      <ImageUploadModal
        open={photoOpen}
        title="Profile Photo"
        currentImage={profile.ProfileImagePath}
        onClose={() => setPhotoOpen(false)}
        onUpload={async (file) => {
          const res = await uploadProfileImage(file);
          if (res.success) await load();
          return res;
        }}
      />

      <ImageUploadModal
        open={signatureOpen}
        title="Signature"
        currentImage={profile.SignatureImagePath}
        previewClassName="h-24 w-full rounded-md border border-stone-200 bg-stone-50 object-contain"
        onClose={() => setSignatureOpen(false)}
        onUpload={async (file) => {
          const res = await uploadSignatureImage(file);
          if (res.success) await load();
          return res;
        }}
      />

      <ChildFormModal
        open={childFormOpen}
        child={editingChild}
        onClose={() => setChildFormOpen(false)}
        onSubmit={handleChildSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingChild)}
        loading={deleteLoading}
        title="Delete child record"
        message={`Delete ${deletingChild?.FirstName} ${deletingChild?.LastName}'s record? This can't be undone.`}
        confirmLabel="Delete"
        confirmVariant="dangerSolid"
        onCancel={() => setDeletingChild(null)}
        onConfirm={handleDeleteChild}
      />
    </div>
  );
}
