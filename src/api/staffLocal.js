import { listDocs, createDoc, updateDocById, where, tryOp } from "./firestoreHelpers";
import { logAction } from "./logsLocal";
import { getCurrentActor } from "./currentActor";

const COLLECTION = "staff";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function withId(doc) {
  return { ...doc, StaffID: doc.id };
}

async function emailTaken(email, excludeId) {
  const docs = await listDocs(COLLECTION, [where("Email", "==", email)]);
  return docs.some((s) => s.id !== excludeId);
}

export async function listStaff() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", false)]);
    return { success: true, staff: docs.map(withId) };
  }, "Couldn't load staff. Check your connection and Firebase setup.");
}

export async function listArchivedStaff() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", true)]);
    return { success: true, staff: docs.map(withId) };
  });
}

export async function createStaff(fields) {
  return tryOp(async () => {
    const { firstName, lastName, email, role } = fields;
    if (!firstName || !lastName || !email) {
      return { success: false, message: "First name, last name, and email are required." };
    }
    if (!isValidEmail(email)) {
      return { success: false, message: "A valid email address is required." };
    }
    if (!["Admin", "Staff"].includes(role)) {
      return { success: false, message: "Invalid role." };
    }
    if (await emailTaken(email)) {
      return { success: false, message: "That email is already registered." };
    }
    const id = await createDoc(COLLECTION, {
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      Role: role,
      Status: "Active",
      IsArchived: false,
      Password: "StaffPassword", 
      MustChangePassword: true,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, `Created ${role.toLowerCase()} account`, "Staff", id);
    return {
      success: true,
      staffId: id,
      message: "Account created. Default password: StaffPassword",
    };
  }, "Couldn't create account. Check your connection and Firebase setup.");
}

export async function updateStaff(staffId, fields) {
  return tryOp(async () => {
    const { firstName, lastName, email, role } = fields;
    if (!firstName || !lastName || !email) {
      return { success: false, message: "First name, last name, and email are required." };
    }
    if (!isValidEmail(email)) {
      return { success: false, message: "A valid email address is required." };
    }
    if (await emailTaken(email, staffId)) {
      return { success: false, message: "That email is already registered." };
    }
    await updateDocById(COLLECTION, staffId, { FirstName: firstName, LastName: lastName, Email: email, Role: role });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

async function setStatus(staffId, status, logMessage) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, staffId, { Status: status });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, logMessage, "Staff", staffId);
    return { success: true };
  });
}

export function deactivateStaff(staffId) {
  return setStatus(staffId, "Deactivated", "Deactivated staff account");
}

export function reactivateStaff(staffId) {
  return setStatus(staffId, "Active", "Reactivated staff account");
}

export async function archiveStaff(staffId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, staffId, { IsArchived: true });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Archived staff account", "Staff", staffId);
    return { success: true };
  });
}

export async function restoreStaff(staffId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, staffId, { IsArchived: false, Status: "Active" });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Restored staff account", "Staff", staffId);
    return { success: true };
  });
}

export async function resetStaffPassword(staffId, newPassword = "") {
  return tryOp(async () => {
    if (newPassword && newPassword.length < 7) {
      return { success: false, message: "Password must be at least 7 characters." };
    }
    const generated = newPassword || Math.random().toString(16).slice(2, 10);
    await updateDocById(COLLECTION, staffId, {
      Password: generated, 
      MustChangePassword: true,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Reset staff password", "Staff", staffId);
    return {
      success: true,
      newPassword: generated,
      message: "Password reset. The account must change it on next login.",
    };
  });
}
