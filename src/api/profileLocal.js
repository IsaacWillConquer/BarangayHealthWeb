import {
  getDocById,
  updateDocById,
  listDocs,
  createDoc,
  deleteDocById,
  where,
  tryOp,
} from "./firestoreHelpers";
import { SELF_RESIDENT_ID } from "./currentResident";

const RESIDENTS_COLLECTION = "residents";
const CHILDREN_COLLECTION = "children";

function calcAge(birthdate) {
  if (!birthdate) return null;
  const bd = new Date(birthdate);
  const diff = new Date(Date.now() - bd.getTime());
  return Math.abs(diff.getUTCFullYear() - 1970);
}

function isFutureDate(date) {
  return new Date(date) > new Date(new Date().toDateString());
}

function isTooOldDate(date, maxYears = 120) {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - maxYears);
  return new Date(date) < limit;
}

export async function getProfile() {
  return tryOp(async () => {
    const resident = await getDocById(RESIDENTS_COLLECTION, SELF_RESIDENT_ID);
    if (!resident) return { success: false, message: "Profile not found." };

    const childDocs = await listDocs(CHILDREN_COLLECTION, [
      where("ResidentID", "==", SELF_RESIDENT_ID),
    ]);
    const children = childDocs.map((c) => ({
      ...c,
      ChildID: c.id,
      Age: calcAge(c.Birthdate),
    }));

    return {
      success: true,
      profile: {
        ...resident,
        ResidentID: resident.id,
        age: calcAge(resident.Birthday),
        spouse: resident.CivilStatus === "Married" ? resident.Spouse || null : null,
        children,
      },
    };
  }, "Couldn't load your profile. Check your connection and Firebase setup.");
}

export async function updateProfile(fields) {
  return tryOp(async () => {
    if (!["Single", "Married", "Widowed", "Separated", "Divorced"].includes(fields.civilStatus)) {
      return { success: false, message: "A valid civil status is required." };
    }
    if (!["Male", "Female", "Other"].includes(fields.gender)) {
      return { success: false, message: "A valid gender is required." };
    }
    if (!fields.address) return { success: false, message: "Address is required." };
    if (!/^\d{11}$/.test(fields.contactNumber || "")) {
      return { success: false, message: "Contact number must be exactly 11 digits." };
    }
    for (const [key, label] of [
      ["homePhone", "Home phone"],
      ["emergencyContactNumber", "Emergency contact number"],
    ]) {
      const v = fields[key];
      if (v && !/^\d{11}$/.test(v)) {
        return { success: false, message: `${label} must be exactly 11 digits.` };
      }
    }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return { success: false, message: "Email address is not valid." };
    }
    if (!fields.emergencyContactName || !fields.emergencyContactRelationship || !fields.emergencyContactNumber) {
      return { success: false, message: "Emergency contact name, relationship, and number are all required." };
    }
    if (!fields.birthday) return { success: false, message: "Birthday is required." };
    if (isFutureDate(fields.birthday)) return { success: false, message: "Birthday cannot be in the future." };
    if (isTooOldDate(fields.birthday)) {
      return { success: false, message: "Birthday is too far in the past — please check the year." };
    }

    if (fields.civilStatus === "Married") {
      if (!fields.spouseName) {
        return { success: false, message: "Spouse name is required when civil status is Married." };
      }
      if (fields.spouseBirthdate) {
        if (isFutureDate(fields.spouseBirthdate)) {
          return { success: false, message: "Spouse birthdate cannot be in the future." };
        }
        if (calcAge(fields.spouseBirthdate) < 18) {
          return { success: false, message: "Spouse must be at least 18 years old." };
        }
      }
    }

    const update = {
      MiddleName: fields.middleName || "",
      ExtensionName: fields.extensionName || "",
      CivilStatus: fields.civilStatus,
      Gender: fields.gender,
      Address: fields.address,
      Address2: fields.address2 || "",
      Email: fields.email || "",
      ContactNumber: fields.contactNumber,
      HomePhone: fields.homePhone || "",
      EmergencyContactName: fields.emergencyContactName,
      EmergencyContactRelationship: fields.emergencyContactRelationship,
      EmergencyContactNumber: fields.emergencyContactNumber,
      Birthday: fields.birthday,
      Bio: fields.bio || "",
      Occupation: fields.occupation || "",
      OccupationLocation: fields.occupationLocation || "",
      FatherName: fields.fatherName || "",
      MotherName: fields.motherName || "",
      Reference1Name: fields.reference1Name || "",
      Reference1Contact: fields.reference1Contact || "",
      Reference2Name: fields.reference2Name || "",
      Reference2Contact: fields.reference2Contact || "",
      Spouse:
        fields.civilStatus === "Married"
          ? {
              Name: fields.spouseName,
              Birthdate: fields.spouseBirthdate || null,
              CivilStatus: fields.spouseCivilStatus || null,
              Status: fields.spouseStatus || "Alive",
            }
          : null,
    };

    await updateDocById(RESIDENTS_COLLECTION, SELF_RESIDENT_ID, update);
    return { success: true };
  }, "Couldn't save your profile. Check your connection and Firebase setup.");
}

async function uploadImage(file, field) {
  return tryOp(async () => {
    if (!file) return { success: false, message: "No image uploaded." };
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return { success: false, message: "Only JPG or PNG images are allowed." };
    }
    if (file.size > 3 * 1024 * 1024) {
      return { success: false, message: "Image must be under 3MB." };
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    await updateDocById(RESIDENTS_COLLECTION, SELF_RESIDENT_ID, { [field]: dataUrl });
    return { success: true, imagePath: dataUrl };
  }, "Couldn't upload image. Check your connection and Firebase setup.");
}

export function uploadProfileImage(file) {
  return uploadImage(file, "ProfileImagePath");
}

export function uploadSignatureImage(file) {
  return uploadImage(file, "SignatureImagePath");
}

async function validateChild(fields) {
  if (!fields.lastName || !fields.firstName) {
    return "Child last name and first name are required.";
  }
  if (!fields.birthdate) return "Child birthdate is required.";
  if (isFutureDate(fields.birthdate)) return "Child birthdate cannot be in the future.";
  if (isTooOldDate(fields.birthdate)) {
    return "Child birthdate is too far in the past — please check the year.";
  }
  const resident = await getDocById(RESIDENTS_COLLECTION, SELF_RESIDENT_ID);
  if (resident?.Birthday) {
    const parentAge = calcAge(resident.Birthday);
    const childAge = calcAge(fields.birthdate);
    if (parentAge - childAge < 12) {
      return "Child age does not look consistent with your age — please double check the birthdate.";
    }
  }
  return null;
}

export async function addChild(fields) {
  return tryOp(async () => {
    const error = await validateChild(fields);
    if (error) return { success: false, message: error };

    const id = await createDoc(CHILDREN_COLLECTION, {
      ResidentID: SELF_RESIDENT_ID,
      LastName: fields.lastName,
      FirstName: fields.firstName,
      Birthdate: fields.birthdate,
      Gender: fields.gender || null,
      Status: fields.status || "Living",
    });
    return { success: true, childId: id };
  }, "Couldn't add child record. Check your connection and Firebase setup.");
}

export async function updateChild(childId, fields) {
  return tryOp(async () => {
    const error = await validateChild(fields);
    if (error) return { success: false, message: error };

    await updateDocById(CHILDREN_COLLECTION, childId, {
      LastName: fields.lastName,
      FirstName: fields.firstName,
      Birthdate: fields.birthdate,
      Gender: fields.gender || null,
      Status: fields.status || "Living",
    });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

export async function deleteChild(childId) {
  return tryOp(async () => {
    await deleteDocById(CHILDREN_COLLECTION, childId);
    return { success: true };
  });
}
