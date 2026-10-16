import Modal from "./ui/Modal";
import DataTable from "./ui/DataTable";

const columns = [
  {
    key: "Name",
    label: "Resident",
    render: (s) => `${s.FirstName} ${s.LastName}`,
  },
  { key: "SignedUpAt", label: "Signed up" },
];

export default function SignupsModal({ open, event, signups, loading, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? `Signups — ${event.Title}` : "Signups"}
      maxWidth="max-w-lg"
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={(signups || []).map((s) => ({ id: s.ResidentID, ...s }))}
          emptyMessage="No one has signed up yet."
        />
      )}
    </Modal>
  );
}
