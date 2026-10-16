import { useEffect, useMemo, useState } from "react";
import SearchBar from "./ui/SearchBar";

export default function ResidentPicker({ fetchResidents, onSelect }) {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents().then((res) => {
      if (res.success) setResidents(res.residents);
      setLoading(false);
    });
  }, [fetchResidents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      [r.ResidentNumber, r.FirstName, r.LastName, r.ContactNumber]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [residents, search]);

  return (
    <div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by resident # or name…"
      />
      <div className="mt-3 max-h-72 divide-y divide-stone-100 overflow-y-auto rounded-md border border-stone-200">
        {loading ? (
          <p className="p-4 text-center text-sm text-stone-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-stone-500">
            No residents match.
          </p>
        ) : (
          filtered.map((r) => (
            <button
              key={r.ResidentID}
              onClick={() => onSelect(r)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-stone-50"
            >
              <span>
                <span className="font-medium text-stone-800">
                  {r.FirstName} {r.LastName}
                </span>
                <span className="ml-2 text-stone-400">
                  {r.ResidentNumber}
                </span>
              </span>
              <span className="text-stone-400">{r.ContactNumber}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
