import { Link } from "react-router-dom";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { watchActiveEvents } from "../../api/residentEventsLocal";
import { watchResidentSurveys } from "../../api/residentSurveysLocal";
import { watchMyHistory } from "../../api/residentHealthHistoryLocal";
import { useLiveData } from "../../hooks/useLiveData";

export default function ResidentDashboard() {
  const liveEvents = useLiveData(watchActiveEvents);
  const liveSurveys = useLiveData(watchResidentSurveys);
  const liveHistory = useLiveData(watchMyHistory);

  const events = liveEvents.data ?? [];
  const surveys = liveSurveys.data?.active ?? [];
  const completedCount = liveSurveys.data?.completed.length ?? 0;
  const historyCount = liveHistory.data?.length ?? 0;
  const loading = liveEvents.loading || liveSurveys.loading || liveHistory.loading;

  const errors = [];
  if (liveEvents.error) errors.push("health events");
  if (liveSurveys.error) errors.push("surveys");
  if (liveHistory.error) errors.push("health history");

  if (loading) {
    return <p className="py-8 text-center text-sm text-stone-500">Loading dashboard…</p>;
  }

  const signedUpCount = events.filter((e) => e.isSignedUp).length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Dashboard</h1>

      {errors.length > 0 && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&apos;t load {errors.join(", ")}. Check your connection and try again.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open Events" value={events.length} icon="📅" />
        <StatCard label="My Sign-ups" value={signedUpCount} icon="🎫" />
        <StatCard label="Open Surveys" value={surveys.length} icon="✅" />
        <StatCard label="Completed" value={completedCount} icon="📊" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
              Upcoming Health Events
            </h2>
            <Link
              to="/resident/health-events"
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              View all
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              No upcoming events right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.slice(0, 4).map((e) => (
                <li key={e.EventID} className="rounded-md border border-stone-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{e.Title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        📅 {e.EventDate}
                        {e.StartTime && ` · ${e.StartTime}`}
                      </p>
                      <p className="text-xs text-stone-500">📍 {e.Location}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={e.Status} />
                      {e.isSignedUp && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">Signed up</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
              Open Surveys
            </h2>
            <Link
              to="/resident/surveys"
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              View all
            </Link>
          </div>

          {surveys.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              No open surveys right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {surveys.slice(0, 4).map((s) => (
                <li key={s.SurveyID} className="rounded-md border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-800">{s.Title}</p>
                  {s.Description && (
                    <p className="mt-1 text-xs text-stone-500">{s.Description}</p>
                  )}
                  {s.CloseAt && (
                    <p className="mt-1 text-xs text-stone-400">Closes {s.CloseAt}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink
          to="/resident/health-history"
          label="My Health History"
          detail={`${historyCount} record${historyCount === 1 ? "" : "s"} on file`}
          icon="📊"
        />
        <QuickLink
          to="/resident/surveys"
          label="My Responses"
          detail={`${completedCount} survey${completedCount === 1 ? "" : "s"} completed`}
          icon="✅"
        />
        <QuickLink
          to="/resident/profile"
          label="My Profile"
          detail="Update your personal details"
          icon="🧑"
        />
      </div>
    </div>
  );
}

function QuickLink({ to, label, detail, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-stone-50"
    >
      <span aria-hidden className="text-xl">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <p className="text-xs text-stone-500">{detail}</p>
      </div>
    </Link>
  );
}