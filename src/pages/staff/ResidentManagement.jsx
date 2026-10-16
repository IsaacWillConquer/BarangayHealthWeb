import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import SearchBar from "../../components/ui/SearchBar";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Modal from "../../components/ui/Modal";
import ResidentFormModal from "../../components/ResidentFormModal";
import {
  listResidents,
  listArchivedResidents,
  createResident,
  updateResident,
  deactivateResident,
  reactivateResident,
  archiveResident,
  restoreResident,
  resetResidentPassword,
  approveResident,
  rejectResident,
} from "../../api/residentsLocal";

const columns = [
  { key: "ResidentNumber", label: "Resident #" },
  {
    key: "Name",
    label: "Name",
    render: (r) =>
      [r.FirstName, r.MiddleName, r.LastName, r.ExtensionName]
        .filter(Boolean)
        .join(" "),
  },
  { key: "ContactNumber", label: "Contact" },
  { key: "Address", label: "Address" },
  {
    key: "Status",
    label: "Status",
    render: (r) => <StatusBadge status={r.Status} />,
  },
];

const TABS = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

const REGISTRATION_STATUSES = ["Pending", "Rejected"];

const EMPTY_MESSAGES = {
  active: "No residents found.",
  pending: "No pending registrations.",
  rejected: "No rejected registrations.",
  archived: "No archived residents.",
};

export default function ResidentManagement() {
  const [residents, setResidents] = useState([]);
  const [archived, setArchived] = useState([]);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [viewingResident, setViewingResident] = useState(null);
  const [rejectingResident, setRejectingResident] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  async function loadActive() {
    const res = await listResidents();
    if (res.success) {
      setResidents(res.residents);
      setLoadError("");
    } else {
      setLoadError(res.message || "Failed to load residents.");
    }
  }

  async function loadArchived() {
    const res = await listArchivedResidents();
    if (res.success) setArchived(res.residents || []);
  }

  useEffect(() => {
                    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadActive(), loadArchived()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const pending = useMemo(
    () => residents.filter((r) => r.Status === "Pending"),
    [residents]
  );
  const rejected = useMemo(
    () => residents.filter((r) => r.Status === "Rejected"),
    [residents]
  );
  const active = useMemo(
    () => residents.filter((r) => !REGISTRATION_STATUSES.includes(r.Status)),
    [residents]
  );

  const bucket = useMemo(
    () => ({ active, pending, rejected, archived }),
    [active, pending, rejected, archived]
  );

  const tabCounts = useMemo(
    () => ({
      active: active.length,
      pending: pending.length,
      rejected: rejected.length,
      archived: archived.length,
    }),
    [active, pending, rejected, archived]
  );

  const filteredResidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = bucket[tab] || [];
    if (!q) return rows;
    return rows.filter((r) =>
      [r.ResidentNumber, r.FirstName, r.LastName, r.ContactNumber, r.Address]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [bucket, tab, search]);

  function openCreate() {
    setEditingResident(null);
    setFormOpen(true);
  }

  function openEdit(resident) {
    setEditingResident(resident);
    setFormOpen(true);
  }

  async function handleFormSubmit(fields) {
    const res = editingResident
      ? await updateResident(editingResident.ResidentID, fields)
      : await createResident(fields);

    if (res.success) {
      setFormOpen(false);
      await loadActive();
    }
    return res;
  }

  async function handleReject() {
    if (!rejectingResident) return;
    setConfirmLoading(true);
    try {
      const res = await rejectResident(rejectingResident.ResidentID, rejectReason);
      if (res.success) {
        setRejectingResident(null);
        setRejectReason("");
        await loadActive();
      }
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    const { type, resident } = confirmAction;
    setConfirmLoading(true);
    try {
      if (type === "resetPassword") {
        const res = await resetResidentPassword(resident.ResidentID);
        if (res.success) {
          setGeneratedPassword(res.newPassword);
          setConfirmAction(null);
        }
        return;
      }

      const actionFn = {
        deactivate: deactivateResident,
        reactivate: reactivateResident,
        archive: archiveResident,
        restore: restoreResident,
        approve: approveResident,
      }[type];

      const res = await actionFn(resident.ResidentID);
      if (res.success) {
        await Promise.all([loadActive(), loadArchived()]);
        setConfirmAction(null);
      }
    } finally {
      setConfirmLoading(false);
    }
  }

  const confirmCopy = {
    deactivate: {
      title: "Deactivate resident",
      message: `Deactivate ${confirmAction?.resident?.FirstName}? They won't be able to log in until reactivated.`,
      confirmLabel: "Deactivate",
      confirmVariant: "dangerSolid",
    },
    reactivate: {
      title: "Reactivate resident",
      message: `Reactivate ${confirmAction?.resident?.FirstName}? They'll be able to log in again.`,
      confirmLabel: "Reactivate",
      confirmVariant: "primary",
    },
    archive: {
      title: "Archive resident",
      message: `Archive ${confirmAction?.resident?.FirstName}? Their record moves to Archived Residents.`,
      confirmLabel: "Archive",
      confirmVariant: "dangerSolid",
    },
    restore: {
      title: "Restore resident",
      message: `Restore ${confirmAction?.resident?.FirstName} back to the active list?`,
      confirmLabel: "Restore",
      confirmVariant: "primary",
    },
    approve: {
      title: "Approve registration",
      message: `Approve the registration of ${confirmAction?.resident?.FirstName}? They will be able to log in with Resident Number ${confirmAction?.resident?.ResidentNumber}.`,
      confirmLabel: "Approve",
      confirmVariant: "primary",
    },
    resetPassword: {
      title: "Reset password",
      message: `Reset the password for ${confirmAction?.resident?.FirstName}? A new one-time password will be generated.`,
      confirmLabel: "Reset password",
      confirmVariant: "dangerSolid",
    },
  }[confirmAction?.type];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">
          Resident Management
        </h1>
        <Button onClick={openCreate}>+ New Resident</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                tab === t.key
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label} ({tabCounts[t.key]})
            </button>
          ))}
        </div>

        <div className="mt-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by resident #, name, contact, or address…"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading residents…
            </p>
          ) : loadError ? (
            <p className="py-8 text-center text-sm text-red-600">
              {loadError}
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredResidents}
              emptyMessage={EMPTY_MESSAGES[tab]}
              renderActions={(r) =>
                tab === "pending" ? (
                  <>
                    <Button variant="neutral" onClick={() => setViewingResident(r)}>
                      View
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() =>
                        setConfirmAction({ type: "approve", resident: r })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="dangerSolid"
                      onClick={() => {
                        setRejectReason("");
                        setRejectingResident(r);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : tab === "rejected" ? (
                  <>
                    <Button variant="neutral" onClick={() => setViewingResident(r)}>
                      View
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() =>
                        setConfirmAction({ type: "approve", resident: r })
                      }
                    >
                      Approve
                    </Button>
                  </>
                ) : tab === "archived" ? (
                  <Button
                    variant="primary"
                    onClick={() => setConfirmAction({ type: "restore", resident: r })}
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button variant="primary" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      variant="neutral"
                      onClick={() =>
                        setConfirmAction({ type: "resetPassword", resident: r })
                      }
                    >
                      Reset Password
                    </Button>
                    {r.Status === "Active" ? (
                      <Button
                        variant="danger"
                        onClick={() =>
                          setConfirmAction({ type: "deactivate", resident: r })
                        }
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="neutral"
                        onClick={() =>
                          setConfirmAction({ type: "reactivate", resident: r })
                        }
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button
                      variant="dangerSolid"
                      onClick={() =>
                        setConfirmAction({ type: "archive", resident: r })
                      }
                    >
                      Archive
                    </Button>
                  </>
                )
              }
            />
          )}
        </div>
      </div>

      <ResidentFormModal
        open={Boolean(viewingResident)}
        resident={viewingResident}
        readOnly
        onClose={() => setViewingResident(null)}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(rejectingResident)}
        onClose={() => setRejectingResident(null)}
        title="Reject registration"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-stone-600">
          Reject the registration of {rejectingResident?.FirstName}? They will not be
          able to log in. Optionally note a reason so staff can follow up.
        </p>
        <label className="mt-4 block text-sm font-medium text-stone-700">
          Reason (optional)
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. Address could not be verified"
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="neutral"
            onClick={() => setRejectingResident(null)}
            disabled={confirmLoading}
          >
            Cancel
          </Button>
          <Button
            variant="dangerSolid"
            onClick={handleReject}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Working…" : "Reject"}
          </Button>
        </div>
      </Modal>

      <ResidentFormModal
        open={formOpen}
        resident={editingResident}
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

      <Modal
        open={Boolean(generatedPassword)}
        onClose={() => setGeneratedPassword(null)}
        title="New password generated"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-stone-600">
          Share this with the resident — it won't be shown again:
        </p>
        <p className="mt-3 rounded-md bg-stone-100 px-3 py-2 text-center font-mono text-lg text-stone-900">
          {generatedPassword}
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setGeneratedPassword(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
