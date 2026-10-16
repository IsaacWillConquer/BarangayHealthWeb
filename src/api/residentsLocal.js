import {
  listDocs,
  createDoc,
  updateDocById,
  nextSequenceValue,
  where,
  tryOp,
} from "./firestoreHelpers";
import { logAction } from "./logsLocal";
import { getCurrentActor } from "./currentActor";

const COLLECTION = "residents";
const COUNTERS_COLLECTION = "counters";
const RESIDENT_NUMBER_COUNTER = "residentNumber";

const PHONE_FIELDS = [
  ["contactNumber", "Contact number", true],
  ["homePhone", "Home phone", false],
  ["emergencyContactNumber", "Emergency contact number", true],
];

function validatePhones(fields) {
  for (const [key, label, isRequired] of PHONE_FIELDS) {
    const value = (fields[key] || "").trim();
    if (!value) {
      if (isRequired) return { success: false, message: `${label} is required.` };
      continue;
    }
    if (!/^\d{11}$/.test(value)) {
      return { success: false, message: `${label} must be exactly 11 digits.` };
    }
  }
  return { success: true };
}

function toFieldsRecord(fields) {
  return {
    FirstName: fields.firstName,
    MiddleName: fields.middleName,
    LastName: fields.lastName,
    ExtensionName: fields.extensionName,
    CivilStatus: fields.civilStatus,
    Gender: fields.gender,
    Birthday: fields.birthday,
    Address: fields.address,
    Address2: fields.address2,
    Email: fields.email,
    ContactNumber: fields.contactNumber,
    HomePhone: fields.homePhone,
    EmergencyContactName: fields.emergencyContactName,
    EmergencyContactRelationship: fields.emergencyContactRelationship,
    EmergencyContactNumber: fields.emergencyContactNumber,
  };
}

function withId(doc) {
  return { ...doc, ResidentID: doc.id };
}

export async function listResidents() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", false)]);
    return { success: true, residents: docs.map(withId) };
  }, "Couldn't load residents. Check your connection and Firebase setup.");
}

export async function listArchivedResidents() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", true)]);
    return { success: true, residents: docs.map(withId) };
  });
}

/**
 * Reserves the next Resident Number from the shared counter.
 *
 * The Flutter app reads and writes `counters/residentNumber` the same way, so
 * registrations made on mobile cannot reuse a number handed out here.
 *
 * `startAt` is 1, not 0, because this project already ships with `RES-0001`.
 * Starting from 0 would hand out a colliding `RES-0001` if the counter document
 * were ever deleted or reset. The Flutter app seeds the counter to at least 1
 * on launch, so both sides agree on the floor.
 */
async function nextResidentNumber() {
  const next = await nextSequenceValue(
    COUNTERS_COLLECTION,
    RESIDENT_NUMBER_COUNTER,
    "value",
    1
  );
  return `RES-${String(next).padStart(4, "0")}`;
}

export async function createResident(fields) {
  return tryOp(async () => {
    if (!fields.firstName || !fields.lastName) {
      return { success: false, message: "First name and last name are required." };
    }
    const phoneCheck = validatePhones(fields);
    if (!phoneCheck.success) return phoneCheck;
    const residentNumber = await nextResidentNumber();
    const id = await createDoc(COLLECTION, {
      ResidentNumber: residentNumber,
      Status: "Active",
      IsArchived: false,
      Password: residentNumber,
      MustChangePassword: true,
      ...toFieldsRecord(fields),
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Created resident", "Resident", id);
    return { success: true, residentId: id };
  }, "Couldn't create resident. Check your connection and Firebase setup.");
}

export async function updateResident(residentId, fields) {
  return tryOp(async () => {
    const phoneCheck = validatePhones(fields);
    if (!phoneCheck.success) return phoneCheck;
    await updateDocById(COLLECTION, residentId, toFieldsRecord(fields));
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

async function setStatus(residentId, status, logMessage) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, residentId, { Status: status });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, logMessage, "Resident", residentId);
    return { success: true };
  });
}

/**
 * Approves a pending (or previously rejected) registration.
 *
 * `RejectionReason` is cleared so staff who re-approve a rejected applicant
 * do not see a stale reason next to the approved record.
 */
export function approveResident(residentId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, residentId, {
      Status: "Active",
      RejectionReason: "",
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Approved resident registration", "Resident", residentId);
    return { success: true };
  });
}

export function rejectResident(residentId, reason = "") {
  return tryOp(async () => {
    const trimmed = reason.trim();
    await updateDocById(COLLECTION, residentId, {
      Status: "Rejected",
      RejectionReason: trimmed,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Rejected resident registration", "Resident", residentId);
    return { success: true };
  });
}

export function deactivateResident(residentId) {
  return setStatus(residentId, "Suspended", "Deactivated resident");
}

export function reactivateResident(residentId) {
  return setStatus(residentId, "Active", "Reactivated resident");
}

export async function archiveResident(residentId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, residentId, { IsArchived: true });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Archived resident", "Resident", residentId);
    return { success: true };
  });
}

export async function restoreResident(residentId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, residentId, { IsArchived: false, Status: "Active" });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Restored resident", "Resident", residentId);
    return { success: true };
  });
}

export async function resetResidentPassword(residentId, newPassword = "") {
  return tryOp(async () => {
    if (newPassword && newPassword.length < 7) {
      return { success: false, message: "Password must be at least 7 characters." };
    }
    const generated = newPassword || Math.random().toString(16).slice(2, 10);
    await updateDocById(COLLECTION, residentId, {
      Password: generated, 
      MustChangePassword: true,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Reset resident password", "Resident", residentId);
    return {
      success: true,
      newPassword: generated,
      message: "Password reset. The resident must change it on next login.",
    };
  });
}
