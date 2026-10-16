import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

export default function ImageUploadModal({
  open,
  title,
  currentImage,
  previewClassName = "h-40 w-full rounded-md border border-stone-200 object-cover",
  onClose,
  onUpload,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      {open && (
        <UploadForm
          currentImage={currentImage}
          previewClassName={previewClassName}
          onClose={onClose}
          onUpload={onUpload}
        />
      )}
    </Modal>
  );
}

function UploadForm({ currentImage, previewClassName, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError("");
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setSaving(true);
    try {
      const res = await onUpload(file);
      if (!res.success) setError(res.message || "Upload failed.");
      else onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {preview && <img src={preview} alt="" className={previewClassName} />}
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="w-full text-sm text-stone-600"
      />
      <p className="text-xs text-stone-500">JPG or PNG, under 3MB.</p>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="neutral" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || saving}>
          {saving ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </div>
  );
}
