export default function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
