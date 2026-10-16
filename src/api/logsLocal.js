import { listDocs, createDoc, where, tryOp } from "./firestoreHelpers";

const COLLECTION = "logs";
const PAGE_SIZE = 15;

export function logAction(actorType, actorId, action, targetType = null, targetId = null) {
  createDoc(COLLECTION, {
    ActorType: actorType,
    ActorID: actorId,
    Action: action,
    TargetType: targetType,
    TargetID: targetId,
    Timestamp: new Date().toISOString(),
  }).catch((err) => console.error("Failed to write log entry:", err));
}

export async function listLogs({ actorType, dateFrom, dateTo, page = 1 } = {}) {
  return tryOp(async () => {
    const constraints = [];
    if (actorType) constraints.push(where("ActorType", "==", actorType));
    if (dateFrom) constraints.push(where("Timestamp", ">=", dateFrom));
    if (dateTo) constraints.push(where("Timestamp", "<=", `${dateTo}T23:59:59`));

    const docs = await listDocs(COLLECTION, constraints);
    const sorted = docs.sort((a, b) => (a.Timestamp < b.Timestamp ? 1 : -1));

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const logs = sorted.slice(start, start + PAGE_SIZE).map((l) => ({ ...l, LogID: l.id }));

    return { success: true, logs, page, totalPages, total };
  }, "Couldn't load logs. Check your connection and Firebase setup.");
}
