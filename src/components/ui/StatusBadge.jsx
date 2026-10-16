const styles = {
  Active: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
  Suspended: "bg-red-100 text-red-700",
  Ongoing: "bg-amber-100 text-amber-700",
  Chronic: "bg-red-100 text-red-700",
  Monitoring: "bg-blue-100 text-blue-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Voided: "bg-stone-200 text-stone-500",
  Draft: "bg-stone-200 text-stone-600",
  Upcoming: "bg-blue-100 text-blue-700",
  Closed: "bg-stone-200 text-stone-500",
  Cancelled: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 ${
        styles[status] || "bg-stone-100 text-stone-600"
      }`}
    >
      {status}
    </span>
  );
}
