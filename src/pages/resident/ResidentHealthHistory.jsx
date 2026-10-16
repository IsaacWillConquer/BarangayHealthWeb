import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import { watchMyHistory } from "../../api/residentHealthHistoryLocal";
import { useLiveData } from "../../hooks/useLiveData";

const columns = [
  {
    key: "Condition",
    label: "Condition",
    render: (r) => (r.ConditionType === "Other" ? r.OtherConditionText : r.ConditionType),
  },
  { key: "RecordDate", label: "Date" },
  {
    key: "Status",
    label: "Status",
    render: (r) => <StatusBadge status={r.Status} />,
  },
  { key: "Notes", label: "Notes" },
];

export default function ResidentHealthHistory() {
  const { data, loading } = useLiveData(watchMyHistory);
  const records = data ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">My Health History</h1>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">Loading…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={records.map((r) => ({ id: r.RecordID, ...r }))}
              emptyMessage="No health records on file yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}
