import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ResidentPicker from "../../components/ResidentPicker";
import HealthHistoryFormModal from "../../components/HealthHistoryFormModal";
import { listResidents } from "../../api/residentsLocal";
import {
  listRecords,
  addRecord,
  updateRecord,
  voidRecord,
  restoreRecord,
} from "../../api/healthHistoryLocal";

const columns = [
  {
    key: "Condition",
    label: "Condition",
    render: (r) =>
      r.ConditionType === "Other" ? r.OtherConditionText : r.ConditionType,
  },
  { key: "RecordDate", label: "Date" },
  {
    key: "Status",
    label: "Status",
    render: (r) => <StatusBadge status={r.IsVoided ? "Voided" : r.Status} />,
  },
  { key: "Notes", label: "Notes" },
];

export default function HealthHistory() {
  const [resident, setResident] = useState(null);
  const [records, setRecords] = useState([]);
  const [includeVoided, setIncludeVoided] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadRecords() {
    if (!resident) return;
    setLoading(true);
    const res = await listRecords(resident.ResidentID, includeVoided);
    if (res.success) setRecords(res.records);
    setLoading(false);
  }

  useEffect(() => {
                // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resident, includeVoided]);

  function openAdd() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
    setFormOpen(true);
  }

  async function handleFormSubmit(fields) {
    const res = editingRecord
      ? await updateRecord(editingRecord.RecordID, fields)
      : await addRecord(resident.ResidentID, fields);
    if (res.success) {
      setFormOpen(false);
      await loadRecords();
    }
    return res;
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const fn = confirmAction.type === "void" ? voidRecord : restoreRecord;
      const res = await fn(confirmAction.record.RecordID);
      if (res.success) {
        await loadRecords();
        setConfirmAction(null);
      }
    } finally {
      setConfirmLoading(false);
    }
  }

  if (!resident) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-stone-900">
          Health History
        </h1>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm text-stone-500">
            Select a resident to view or manage their health records.
          </p>
          <ResidentPicker fetchResidents={listResidents} onSelect={setResident} />
        </div>
      </div>
    );
  }

  const confirmCopy =
    confirmAction?.type === "void"
      ? {
          title: "Void record",
          message: "Voided records are hidden by default but not deleted — you can restore them anytime.",
          confirmLabel: "Void record",
          confirmVariant: "dangerSolid",
        }
      : {
          title: "Restore record",
          message: "This record will show up in the active list again.",
          confirmLabel: "Restore",
          confirmVariant: "primary",
        };

  return (
    <div>
      <button
        onClick={() => setResident(null)}
        className="mb-3 text-sm text-emerald-800 hover:underline"
      >
        ← Choose a different resident
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {resident.FirstName} {resident.LastName}
          </h1>
          <p className="text-sm text-stone-500">{resident.ResidentNumber}</p>
        </div>
        <Button onClick={openAdd}>+ Add Record</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={includeVoided}
            onChange={(e) => setIncludeVoided(e.target.checked)}
          />
          Include voided records
        </label>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading records…
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={records.map((r) => ({ id: r.RecordID, ...r }))}
              emptyMessage="No health records for this resident yet."
              renderActions={(r) => (
                <>
                  {!r.IsVoided && (
                    <>
                      <Button variant="primary" onClick={() => openEdit(r)}>
                        Edit
                      </Button>
                      <Button
                        variant="dangerSolid"
                        onClick={() => setConfirmAction({ type: "void", record: r })}
                      >
                        Void
                      </Button>
                    </>
                  )}
                  {r.IsVoided && (
                    <Button
                      variant="neutral"
                      onClick={() => setConfirmAction({ type: "restore", record: r })}
                    >
                      Restore
                    </Button>
                  )}
                </>
              )}
            />
          )}
        </div>
      </div>

      <HealthHistoryFormModal
        open={formOpen}
        record={editingRecord}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        loading={confirmLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        {...confirmCopy}
      />
    </div>
  );
}
