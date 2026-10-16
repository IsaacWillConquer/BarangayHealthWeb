import { useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import ResidentPicker from "../../components/ResidentPicker";
import { listResidents } from "../../api/residentsLocal";
import {
  getEventsReport,
  getHealthHistoryReport,
  getResidentPrintData,
} from "../../api/reportsLocal";

const TABS = [
  { key: "events", label: "Events Report" },
  { key: "health", label: "Health History Report" },
  { key: "resident", label: "Resident Print" },
];

function Bar({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-32 shrink-0 text-stone-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-stone-500">{count}</span>
    </div>
  );
}

function DateRangeFields({ start, end, onStart, onEnd }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-stone-700">Start date</span>
        <input
          type="date"
          value={start}
          onChange={(e) => onStart(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-stone-700">End date</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onEnd(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}

function EventsReportTab() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    const res = await getEventsReport(start, end);
    if (!res.success) setError(res.message);
    else setData(res);
    setLoading(false);
  }

  const columns = [
    { key: "Title", label: "Title" },
    { key: "EventType", label: "Type" },
    { key: "EventDate", label: "Date" },
    { key: "Status", label: "Status" },
    { key: "SignupCount", label: "Signups" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Button onClick={run} disabled={loading}>
          {loading ? "Loading…" : "Run report"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <>
          <p className="text-xs text-stone-400">
            {data.startDate || "earliest"} – {data.endDate || "latest"} · {data.events.length} events
          </p>

          {Object.keys(data.byType).length > 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                By type
              </p>
              <div className="space-y-1.5">
                {Object.entries(data.byType).map(([type, count]) => (
                  <Bar key={type} label={type} count={count} total={data.events.length} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <DataTable
              columns={columns}
              rows={data.events.map((e) => ({ id: e.EventID, ...e }))}
              emptyMessage="No events in this range."
            />
          </div>
        </>
      )}
    </div>
  );
}

function HealthHistoryReportTab() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [includeVoided, setIncludeVoided] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    const res = await getHealthHistoryReport(start, end, includeVoided);
    if (!res.success) setError(res.message);
    else setData(res);
    setLoading(false);
  }

  const columns = [
    { key: "ResidentName", label: "Resident" },
    {
      key: "Condition",
      label: "Condition",
      render: (r) => (r.ConditionType === "Other" ? r.OtherConditionText : r.ConditionType),
    },
    { key: "RecordDate", label: "Date" },
    { key: "Status", label: "Status" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFields start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <label className="flex items-center gap-2 pb-2.5 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={includeVoided}
            onChange={(e) => setIncludeVoided(e.target.checked)}
          />
          Include voided
        </label>
        <Button onClick={run} disabled={loading}>
          {loading ? "Loading…" : "Run report"}
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {data && (
        <>
          <p className="text-xs text-stone-400">
            {data.startDate || "earliest"} – {data.endDate || "latest"} · {data.recent.length} shown (max 100)
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                By condition
              </p>
              <div className="space-y-1.5">
                {data.conditionSummary.map((c) => (
                  <Bar
                    key={c.ConditionType}
                    label={c.ConditionType}
                    count={c.Total}
                    total={data.recent.length}
                  />
                ))}
                {data.conditionSummary.length === 0 && (
                  <p className="text-sm text-stone-400">No records in this range.</p>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                By status
              </p>
              <div className="space-y-1.5">
                {data.statusSummary.map((s) => (
                  <Bar key={s.Status} label={s.Status} count={s.Total} total={data.recent.length} />
                ))}
                {data.statusSummary.length === 0 && (
                  <p className="text-sm text-stone-400">No records in this range.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <DataTable
              columns={columns}
              rows={data.recent.map((r) => ({ id: r.RecordID, ...r }))}
              emptyMessage="No records in this range."
            />
          </div>
        </>
      )}
    </div>
  );
}

function ResidentPrintTab() {
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(false);

  async function select(r) {
    setLoading(true);
    const res = await getResidentPrintData(r.ResidentID);
    if (res.success) setResident(res.resident);
    setLoading(false);
  }

  if (!resident) {
    return (
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm text-stone-500">Select a resident to view their printable record.</p>
        <ResidentPicker fetchResidents={listResidents} onSelect={select} />
        {loading && <p className="mt-3 text-sm text-stone-500">Loading…</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => setResident(null)}
          className="text-sm text-emerald-800 hover:underline"
        >
          ← Choose a different resident
        </button>
        <Button onClick={() => window.print()}>Print</Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">
          {resident.FirstName} {resident.MiddleName} {resident.LastName} {resident.ExtensionName}
        </h2>
        <p className="text-sm text-stone-500">{resident.ResidentNumber}</p>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {[
            ["Civil status", resident.CivilStatus],
            ["Gender", resident.Gender],
            ["Birthday", resident.Birthday],
            ["Address", `${resident.Address}${resident.Address2 ? ", " + resident.Address2 : ""}`],
            ["Contact number", resident.ContactNumber],
            ["Email", resident.Email || "—"],
            ["Emergency contact", `${resident.EmergencyContactName || "—"} (${resident.EmergencyContactRelationship || "—"}) ${resident.EmergencyContactNumber || ""}`],
            ["Occupation", resident.Occupation || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
              <dd className="text-sm text-stone-700">{value}</dd>
            </div>
          ))}
        </dl>

        {resident.spouse && (
          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Spouse</p>
            <p className="text-sm text-stone-700">
              {resident.spouse.Name} — {resident.spouse.CivilStatus || "—"}, {resident.spouse.Status}
            </p>
          </div>
        )}

        {resident.children?.length > 0 && (
          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Children</p>
            <ul className="space-y-1 text-sm text-stone-700">
              {resident.children.map((c) => (
                <li key={c.id}>
                  {c.FirstName} {c.LastName} — {c.Birthdate} ({c.Status})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("events");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Reports</h1>

      <div className="mb-5 flex gap-2 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              tab === t.key
                ? "bg-emerald-700 text-white"
                : "bg-white text-stone-600 shadow-sm hover:bg-stone-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "events" && <EventsReportTab />}
      {tab === "health" && <HealthHistoryReportTab />}
      {tab === "resident" && <ResidentPrintTab />}
    </div>
  );
}
