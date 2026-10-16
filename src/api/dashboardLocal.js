import { subscribeDocs, where } from "./firestoreHelpers";

const RESIDENTS = "residents";
const SURVEYS = "surveys";
const RESPONSES = "surveyResponses";
const EVENTS = "healthEvents";
const LOGS = "logs";

export function computeStats({ residents, surveys, responses, events }) {
  const active = residents.filter((r) => r.Status === "Active");
  const totalResidents = active.length;
  const totalResponses = responses.length;
  const participationRate =
    totalResidents === 0 ? 0 : Math.min(100, Math.round((totalResponses / totalResidents) * 100));

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter(
    (e) => !e.IsArchived && ["Upcoming", "Active"].includes(e.Status) && e.EventDate >= today
  ).length;

  const pendingRegistrations = residents.filter((r) => r.Status === "Pending").length;

  return {
    totalResidents,
    pendingRegistrations,
    activeSurveys: surveys.filter((s) => s.Status === "Active").length,
    draftSurveys: surveys.filter((s) => s.Status === "Draft").length,
    closedSurveys: surveys.filter((s) => s.Status === "Closed").length,
    totalResponses,
    participationRate,
    upcomingEvents,
  };
}

export function computeTrend({ residents, responses }) {
  const residentCount = Math.max(1, residents.filter((r) => r.Status === "Active").length);

  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    data.push(i === 0 ? Math.min(100, Math.round((responses.length / residentCount) * 100)) : 0);
  }
  return { labels, data };
}

export function computeAttention({ surveys, responses }) {
  const drafts = surveys
    .filter((s) => s.Status === "Draft")
    .slice(0, 5)
    .map((s) => ({ SurveyID: s.id, Title: s.Title }));

  const in48h = new Date();
  in48h.setHours(in48h.getHours() + 48);
  const closingSoon = surveys
    .filter((s) => s.Status === "Active" && s.CloseAt && new Date(s.CloseAt) <= in48h)
    .slice(0, 5)
    .map((s) => ({ SurveyID: s.id, Title: s.Title, CloseAt: s.CloseAt }));

  const zeroResponse = surveys
    .filter((s) => s.Status === "Active" && !responses.some((r) => r.SurveyID === s.id))
    .slice(0, 5)
    .map((s) => ({ SurveyID: s.id, Title: s.Title }));

  return { drafts, closingSoon, zeroResponse };
}

export function computeActivity({ logs }, limitCount = 8) {
  return logs
    .sort((a, b) => (a.Timestamp < b.Timestamp ? 1 : -1))
    .slice(0, limitCount)
    .map((l) => ({ ...l, LogID: l.id }));
}

/**
 * Live dashboard feed. Subscribes to every collection the dashboard needs and
 * recomputes all four datasets whenever any of them changes.
 */
export function watchDashboard(onData, onError) {
  const source = { residents: [], surveys: [], responses: [], events: [], logs: [] };

  function emit() {
    onData({
      stats: computeStats(source),
      trend: computeTrend(source),
      attention: computeAttention(source),
      activity: computeActivity(source),
    });
  }

  const unsubs = [
    subscribeDocs(RESIDENTS, [], (docs) => { source.residents = docs; emit(); }, onError),
    subscribeDocs(SURVEYS, [], (docs) => { source.surveys = docs; emit(); }, onError),
    subscribeDocs(RESPONSES, [], (docs) => { source.responses = docs; emit(); }, onError),
    subscribeDocs(
      EVENTS,
      [where("IsArchived", "==", false)],
      (docs) => { source.events = docs; emit(); },
      onError
    ),
    subscribeDocs(LOGS, [], (docs) => { source.logs = docs; emit(); }, onError),
  ];

  return () => unsubs.forEach((u) => u());
}
