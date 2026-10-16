import { listDocs, getDocById, where, tryOp } from "./firestoreHelpers";

const EVENTS = "healthEvents";
const SIGNUPS = "eventSignups";
const HISTORY = "healthHistory";
const RESIDENTS = "residents";
const CHILDREN = "children";

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

function resolveRange(startDate, endDate) {
  if (!startDate && !endDate) return defaultRange();
  return { start: startDate || null, end: endDate || null };
}

export async function getEventsReport(startDate, endDate) {
  return tryOp(async () => {
    const { start, end } = resolveRange(startDate, endDate);
    if (start && end && new Date(start) > new Date(end)) {
      return { success: false, message: "Start date must be before end date." };
    }

    const allEvents = await listDocs(EVENTS, [where("IsArchived", "==", false)]);
    const events = allEvents
      .filter((e) => (!start || e.EventDate >= start) && (!end || e.EventDate <= end))
      .sort((a, b) => (a.EventDate < b.EventDate ? -1 : 1));

    const withCounts = await Promise.all(
      events.map(async (e) => {
        const signups = await listDocs(SIGNUPS, [where("EventID", "==", e.id)]);
        return {
          EventID: e.id,
          Title: e.Title,
          EventType: e.EventType,
          EventDate: e.EventDate,
          Status: e.Status,
          SignupCount: signups.length,
        };
      })
    );

    const byType = {};
    for (const e of withCounts) byType[e.EventType] = (byType[e.EventType] || 0) + 1;

    return { success: true, events: withCounts, byType, startDate: start, endDate: end };
  }, "Couldn't load the events report. Check your connection and Firebase setup.");
}

export async function getHealthHistoryReport(startDate, endDate, includeVoided = false) {
  return tryOp(async () => {
    const { start, end } = resolveRange(startDate, endDate);
    if (start && end && new Date(start) > new Date(end)) {
      return { success: false, message: "Start date must be before end date." };
    }

    const constraints = includeVoided ? [] : [where("IsVoided", "==", false)];
    const allRecords = await listDocs(HISTORY, constraints);
    const records = allRecords.filter(
      (r) => (!start || r.RecordDate >= start) && (!end || r.RecordDate <= end)
    );

    const conditionCounts = {};
    const statusCounts = {};
    for (const r of records) {
      conditionCounts[r.ConditionType] = (conditionCounts[r.ConditionType] || 0) + 1;
      statusCounts[r.Status] = (statusCounts[r.Status] || 0) + 1;
    }
    const conditionSummary = Object.entries(conditionCounts)
      .map(([ConditionType, Total]) => ({ ConditionType, Total }))
      .sort((a, b) => b.Total - a.Total);
    const statusSummary = Object.entries(statusCounts).map(([Status, Total]) => ({ Status, Total }));

    const sorted = [...records].sort((a, b) => (a.RecordDate < b.RecordDate ? 1 : -1)).slice(0, 100);
    const recent = await Promise.all(
      sorted.map(async (r) => {
        const resident = await getDocById(RESIDENTS, r.ResidentID);
        return {
          RecordID: r.id,
          ResidentID: r.ResidentID,
          ResidentName: resident ? `${resident.FirstName} ${resident.LastName}` : "(unknown)",
          ConditionType: r.ConditionType,
          OtherConditionText: r.OtherConditionText,
          RecordDate: r.RecordDate,
          Status: r.Status,
          IsVoided: r.IsVoided,
        };
      })
    );

    return {
      success: true,
      conditionSummary,
      statusSummary,
      recent,
      startDate: start,
      endDate: end,
    };
  }, "Couldn't load the health history report. Check your connection and Firebase setup.");
}

export async function getResidentPrintData(residentId) {
  return tryOp(async () => {
    const resident = await getDocById(RESIDENTS, residentId);
    if (!resident) return { success: false, message: "Resident not found." };

    const children = await listDocs(CHILDREN, [where("ResidentID", "==", residentId)]);

    return {
      success: true,
      resident: {
        ...resident,
        ResidentID: resident.id,
        spouse: resident.CivilStatus === "Married" ? resident.Spouse || null : null,
        children,
      },
    };
  }, "Couldn't load resident data. Check your connection and Firebase setup.");
}
