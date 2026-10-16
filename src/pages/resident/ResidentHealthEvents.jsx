import { useState } from "react";
import Button from "../../components/ui/Button";
import { signUp, cancelSignup, watchActiveEvents } from "../../api/residentEventsLocal";
import { useLiveData } from "../../hooks/useLiveData";

export default function ResidentHealthEvents() {
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");

  const { data: liveEvents, loading } = useLiveData(watchActiveEvents);
  const events = liveEvents ?? [];

  async function handleToggle(event) {
    setError("");
    setActingId(event.EventID);
    try {
      const res = event.isSignedUp
        ? await cancelSignup(event.EventID)
        : await signUp(event.EventID);
      if (!res.success) setError(res.message || "Something went wrong.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Health Events</h1>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-stone-500">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="rounded-lg bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
          No upcoming events right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div key={e.EventID} className="flex flex-col rounded-lg bg-white p-4 shadow-sm">
              {e.ImagePath ? (
                <img src={e.ImagePath} alt="" className="mb-3 h-32 w-full rounded-md object-cover" />
              ) : (
                <div className="mb-3 h-32 w-full rounded-md bg-stone-100" />
              )}
              <p className="font-bold text-stone-900">{e.Title}</p>
              <p className="mt-1 text-xs text-stone-400">{e.EventType}</p>
              <p className="mt-2 text-sm text-stone-600">{e.Description}</p>
              <p className="mt-2 text-xs text-stone-500">
                📅 {e.EventDate}
                {e.StartTime && ` · ${e.StartTime}${e.EndTime ? `–${e.EndTime}` : ""}`}
              </p>
              <p className="text-xs text-stone-500">📍 {e.Location}</p>
              <p className="mt-1 text-xs text-stone-400">{e.signupCount} signed up</p>

              <Button
                className="mt-3 w-full"
                variant={e.isSignedUp ? "dangerSolid" : "primary"}
                disabled={actingId === e.EventID}
                onClick={() => handleToggle(e)}
              >
                {actingId === e.EventID
                  ? "Working…"
                  : e.isSignedUp
                    ? "Cancel Sign-up"
                    : "Sign Up"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
