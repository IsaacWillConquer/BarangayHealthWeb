import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { listLogs } from "../../api/logsLocal";

const columns = [
  { key: "Timestamp", label: "When", render: (l) => new Date(l.Timestamp).toLocaleString() },
  { key: "ActorType", label: "Actor" },
  { key: "Action", label: "Action" },
  {
    key: "Target",
    label: "Target",
    render: (l) => (l.TargetType ? `${l.TargetType}${l.TargetID ? ` (${l.TargetID.slice(0, 8)}…)` : ""}` : "—"),
  },
];

export default function AuditLogs() {
  const [actorType, setActorType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await listLogs({ actorType: actorType || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page });
    if (res.success) {
      setLogs(res.logs);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    }
    setLoading(false);
  }

  useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function applyFilters() {
    setPage(1);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Audit Logs</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-stone-700">Actor type</span>
          <select
            value={actorType}
            onChange={(e) => setActorType(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Resident">Resident</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-stone-700">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-stone-700">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <Button onClick={applyFilters}>Apply filters</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        {loading ? (
          <p className="py-8 text-center text-sm text-stone-500">Loading…</p>
        ) : (
          <>
            <DataTable columns={columns} rows={logs} emptyMessage="No log entries match these filters." />
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
              <span>
                {total} total · page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="neutral"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
