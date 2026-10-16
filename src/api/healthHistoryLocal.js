import { listDocs, createDoc, updateDocById, where, tryOp } from "./firestoreHelpers";
import { validConditions, validStatuses } from "../data/healthHistoryConstants";
import { logAction } from "./logsLocal";
import { getCurrentActor } from "./currentActor";

const COLLECTION = "healthHistory";

function validate(fields) {
  const { conditionType, otherConditionText, recordDate, status } = fields;
  if (!validConditions.includes(conditionType)) {
    return "A valid condition is required.";
  }
  if (conditionType === "Other" && !otherConditionText) {
    return 'Please specify the condition when selecting "Other".';
  }
  if (!recordDate) return "Record date is required.";
  if (new Date(recordDate) > new Date()) {
    return "Record date cannot be in the future.";
  }
  if (!validStatuses.includes(status || "Ongoing")) {
    return "A valid status is required.";
  }
  return null;
}

function withId(doc) {
  return { ...doc, RecordID: doc.id };
}

export async function listRecords(residentId, includeVoided = false) {
  return tryOp(async () => {
    const constraints = [where("ResidentID", "==", residentId)];
    if (!includeVoided) constraints.push(where("IsVoided", "==", false));
    const docs = await listDocs(COLLECTION, constraints);
    return { success: true, records: docs.map(withId) };
  }, "Couldn't load records. Check your connection and Firebase setup.");
}

export async function addRecord(residentId, fields) {
  return tryOp(async () => {
    if (!residentId) return { success: false, message: "Resident is required." };
    const error = validate(fields);
    if (error) return { success: false, message: error };

    const id = await createDoc(COLLECTION, {
      ResidentID: residentId,
      ConditionType: fields.conditionType,
      OtherConditionText: fields.otherConditionText || null,
      RecordDate: fields.recordDate,
      Status: fields.status || "Ongoing",
      Notes: fields.notes || null,
      IsVoided: false,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Added health history record", "Resident", residentId);
    return { success: true, recordId: id };
  }, "Couldn't add record. Check your connection and Firebase setup.");
}

export async function updateRecord(recordId, fields) {
  return tryOp(async () => {
    const error = validate(fields);
    if (error) return { success: false, message: error };

    await updateDocById(COLLECTION, recordId, {
      ConditionType: fields.conditionType,
      OtherConditionText: fields.otherConditionText || null,
      RecordDate: fields.recordDate,
      Status: fields.status || "Ongoing",
      Notes: fields.notes || null,
    });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

export async function voidRecord(recordId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, recordId, { IsVoided: true });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Voided health history record", "HealthHistoryRecord", recordId);
    return { success: true };
  });
}

export async function restoreRecord(recordId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, recordId, { IsVoided: false });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Restored health history record", "HealthHistoryRecord", recordId);
    return { success: true };
  });
}
