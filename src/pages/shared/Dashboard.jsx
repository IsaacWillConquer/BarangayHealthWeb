import StatCard from "../../components/ui/StatCard";
import { watchDashboard } from "../../api/dashboardLocal";
import { useLiveData } from "../../hooks/useLiveData";

export default function Dashboard() {
  const { data, loading } = useLiveData(watchDashboard);

  if (loading || !data) {
    return <p className="py-8 text-center text-sm text-stone-500">Loading dashboard…</p>;
  }

  const { stats, trend, attention, activity } = data;

  const hasAttention =
    attention.drafts.length || attention.closingSoon.length || attention.zeroResponse.length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Residents" value={stats.totalResidents} icon="🧑‍🤝‍🧑" />
        <StatCard label="Active Surveys" value={stats.activeSurveys} icon="✅" />
        <StatCard label="Draft Surveys" value={stats.draftSurveys} icon="📝" />
        <StatCard label="Closed Surveys" value={stats.closedSurveys} icon="🔒" />
        <StatCard label="Total Responses" value={stats.totalResponses} icon="📊" />
        <StatCard label="Participation" value={`${stats.participationRate}%`} icon="📈" />
        <StatCard label="Upcoming Events" value={stats.upcomingEvents} icon="📅" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
            Participation Trend
          </h2>
          <div className="space-y-2">
            {trend.labels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 text-stone-500">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${trend.data[i]}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-stone-500">
                  {trend.data[i]}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400">
            Only this month reflects real data — historical response dates
            aren't tracked in the mock dataset yet.
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
            Recent Activity
          </h2>
          <ul className="space-y-2">
            {activity.map((log) => (
              <li key={log.LogID} className="text-sm">
                <span className="text-stone-800">{log.Action}</span>
                {log.TargetType && (
                  <span className="text-stone-400"> · {log.TargetType}</span>
                )}
                <span className="block text-xs text-stone-400">
                  {new Date(log.Timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {Boolean(hasAttention) && (
        <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
            Needs Attention
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AttentionList title="Draft surveys" items={attention.drafts.map((s) => s.Title)} />
            <AttentionList
              title="Closing soon"
              items={attention.closingSoon.map((s) => `${s.Title} — closes ${s.CloseAt}`)}
            />
            <AttentionList
              title="No responses yet"
              items={attention.zeroResponse.map((s) => s.Title)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AttentionList({ title, items }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-stone-500">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="rounded-md bg-amber-50 px-2.5 py-1.5 text-sm text-amber-800">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
