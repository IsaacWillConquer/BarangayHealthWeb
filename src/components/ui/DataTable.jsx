export default function DataTable({ columns, rows, renderActions, emptyMessage = "No records found." }) {
  if (!rows.length) {
    return (
      <p className="px-1 py-8 text-center text-sm text-stone-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
          {columns.map((col) => (
            <th key={col.key} className="px-3 py-2 font-semibold">
              {col.label}
            </th>
          ))}
          {renderActions && <th className="px-3 py-2" />}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id ?? row.ResidentID}
            className="border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
          >
            {columns.map((col) => (
              <td key={col.key} className="px-3 py-3 text-stone-700">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
            {renderActions && (
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">{renderActions(row)}</div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
