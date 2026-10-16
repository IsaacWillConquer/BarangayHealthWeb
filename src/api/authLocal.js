import { listDocs, updateDocById, where, tryOp } from "./firestoreHelpers";
import { setSelfResidentId } from "./currentResident";
import { setCurrentActor } from "./currentActor";

const RESIDENTS = "residents";
const STAFF = "staff";

export async function login(identifier, password) {
  return tryOp(async () => {
    const byNumber = await listDocs(RESIDENTS, [where("ResidentNumber", "==", identifier)]);
    const byEmail = await listDocs(RESIDENTS, [where("Email", "==", identifier)]);
    const resident = byNumber[0] || byEmail[0];

    if (resident) {
      if (resident.Status !== "Active") {
        return {
          success: false,
          message:
            "This account is not active. Please visit or contact the Barangay Health Center office for assistance.",
        };
      }
      if (resident.Password !== password) {
        return { success: false, message: "Incorrect Resident Number/Email or password." };
      }
      setSelfResidentId(resident.id);
      setCurrentActor("Resident", resident.id);
      return {
        success: true,
        role: "Resident",
        id: resident.id,
        firstName: resident.FirstName,
        mustChangePassword: Boolean(resident.MustChangePassword),
      };
    }

    const staffMatches = await listDocs(STAFF, [where("Email", "==", identifier)]);
    const staff = staffMatches[0];
    if (staff) {
      if (staff.Status !== "Active") {
        return {
          success: false,
          message:
            "This account is not active. Please contact the system administrator for assistance.",
        };
      }
      if (staff.Password !== password) {
        return { success: false, message: "Incorrect email or password." };
      }
      setCurrentActor(staff.Role === "Admin" ? "Admin" : "Staff", staff.id);
      return {
        success: true,
        role: staff.Role === "Admin" ? "Admin" : "Staff",
        id: staff.id,
        firstName: staff.FirstName,
        mustChangePassword: Boolean(staff.MustChangePassword),
      };
    }

    return { success: false, message: "No account found with that Resident Number/Email." };
  }, "Couldn't log in. Check your connection and Firebase setup.");
}

export async function changePassword(role, id, newPassword) {
  return tryOp(async () => {
    if (!newPassword || newPassword.length < 7) {
      return { success: false, message: "Password must be at least 7 characters." };
    }
    const collection = role === "Resident" ? RESIDENTS : STAFF;
    await updateDocById(collection, id, { Password: newPassword, MustChangePassword: false });
    return { success: true };
  }, "Couldn't update password. Check your connection and Firebase setup.");
}
