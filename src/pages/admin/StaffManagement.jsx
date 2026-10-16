import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import SearchBar from "../../components/ui/SearchBar";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Modal from "../../components/ui/Modal";
import StaffFormModal from "../../components/StaffFormModal";
import {
  listStaff,
  listArchivedStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  archiveStaff,
  restoreStaff,
  resetStaffPassword,
} from "../../api/staffLocal";

const columns = [
  {
    key: "Name",
    label: "Name",
    render: (s) => `${s.FirstName} ${s.LastName}`,
  },
  { key: "Email", label: "Email" },
  { key: "Role", label: "Role" },
  {
    key: "Status",
    label: "Status",
    render: (s) => <StatusBadge status={s.Status === "Deactivated" ? "Suspended" : s.Status} />,
  },
];

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [archived, setArchived] = useState([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [generatedPassword, setGeneratedPassword] = useState(null);

  async function loadActive() {
    const res = await listStaff();
    if (res.success) setStaff(res.staff);
  }

  async function loadArchived() {
    const res = await listArchivedStaff();
    if (res.success) setArchived(res.staff);
  }

  useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadActive(), loadArchived()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) =>
      [s.FirstName, s.LastName, s.Email, s.Role]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [staff, search]);

  function openCreate() {
    setEditingStaff(null);
    setFormOpen(true);
  }

  function openEdit(s) {
    setEditingStaff(s);
    setFormOpen(true);
  }

  async function handleFormSubmit(fields) {
    const res = editingStaff
      ? await updateStaff(editingStaff.StaffID, fields)
      : await createStaff(fields);
    if (res.success) {
      setFormOpen(false);
      await loadActive();
    }
    return res;
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    const { type, staff: target } = confirmAction;
    setConfirmLoading(true);
    try {
      if (type === "resetPassword") {
        const res = await resetStaffPassword(target.StaffID);
        if (res.success) {
          setGeneratedPassword(res.newPassword);
          setConfirmAction(null);
        }
        return;
      }

      const actionFn = {
        deactivate: deactivateStaff,
        reactivate: reactivateStaff,
        archive: archiveStaff,
        restore: restoreStaff,
      }[type];

      const res = await actionFn(target.StaffID);
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
      title: "Deactivate account",
      message: `Deactivate ${confirmAction?.staff?.FirstName}? They won't be able to log in until reactivated.`,
      confirmLabel: "Deactivate",
      confirmVariant: "dangerSolid",
    },
    reactivate: {
      title: "Reactivate account",
      message: `Reactivate ${confirmAction?.staff?.FirstName}? They'll be able to log in again.`,
      confirmLabel: "Reactivate",
      confirmVariant: "primary",
    },
    archive: {
      title: "Archive account",
      message: `Archive ${confirmAction?.staff?.FirstName}? Their record moves to Archived Staff.`,
      confirmLabel: "Archive",
      confirmVariant: "dangerSolid",
    },
    restore: {
      title: "Restore account",
      message: `Restore ${confirmAction?.staff?.FirstName} back to the active list?`,
      confirmLabel: "Restore",
      confirmVariant: "primary",
    },
    resetPassword: {
      title: "Reset password",
      message: `Reset the password for ${confirmAction?.staff?.FirstName}? A new one-time password will be generated.`,
      confirmLabel: "Reset password",
      confirmVariant: "dangerSolid",
    },
  }[confirmAction?.type];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">
          Staff Management
        </h1>
        <Button onClick={openCreate}>+ New Staff Account</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or role…"
        />

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading staff…
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredStaff.map((s) => ({ id: s.StaffID, ...s }))}
              renderActions={(s) => (
                <>
                  <Button variant="primary" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button
                    variant="neutral"
                    onClick={() =>
                      setConfirmAction({ type: "resetPassword", staff: s })
                    }
                  >
                    Reset Password
                  </Button>
                  {s.Status === "Active" ? (
                    <Button
                      variant="danger"
                      onClick={() =>
                        setConfirmAction({ type: "deactivate", staff: s })
                      }
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="neutral"
                      onClick={() =>
                        setConfirmAction({ type: "reactivate", staff: s })
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                  <Button
                    variant="dangerSolid"
                    onClick={() =>
                      setConfirmAction({ type: "archive", staff: s })
                    }
                  >
                    Archive
                  </Button>
                </>
              )}
            />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <button
          onClick={() => setArchivedOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800"
        >
          <span className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}>
            ▸
          </span>
          Archived Staff ({archived.length})
        </button>

        {archivedOpen && (
          <div className="mt-4 overflow-x-auto border-t border-stone-100 pt-4">
            <DataTable
              columns={columns}
              rows={archived.map((s) => ({ id: s.StaffID, ...s }))}
              emptyMessage="No archived staff."
              renderActions={(s) => (
                <Button
                  variant="primary"
                  onClick={() => setConfirmAction({ type: "restore", staff: s })}
                >
                  Restore
                </Button>
              )}
            />
          </div>
        )}
      </div>

      <StaffFormModal
        open={formOpen}
        staff={editingStaff}
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
          Share this with the staff member — it won't be shown again:
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
