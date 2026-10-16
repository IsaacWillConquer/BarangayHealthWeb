import { listDocs, createDoc, updateDocById, where, tryOp } from "./firestoreHelpers";
import { validEventTypes, validEventStatuses } from "../data/healthEventsConstants";
import { logAction } from "./logsLocal";
import { getCurrentActor } from "./currentActor";

const COLLECTION = "healthEvents";
const SIGNUPS_COLLECTION = "eventSignups";

function validate(fields) {
  const { title, eventType, location, description, eventDate, startTime, endTime, status } =
    fields;
  if (!title) return "Event title is required.";
  if (title.length > 200) return "Event title must be 200 characters or fewer.";
  if (!validEventTypes.includes(eventType)) return "A valid event type is required.";
  if (!location) return "Event location is required.";
  if (location.length > 255) return "Event location must be 255 characters or fewer.";
  if (description && description.length > 1000) {
    return "Event description must be 1000 characters or fewer.";
  }
  if (!eventDate) return "Event date is required.";
  if (!validEventStatuses.includes(status || "Draft")) {
    return "A valid status is required.";
  }
  if (startTime && endTime && endTime <= startTime) {
    return "End time must be after start time.";
  }
  return null;
}

function withId(doc) {
  return { ...doc, EventID: doc.id };
}

export async function listEvents() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", false)]);
    return { success: true, events: docs.map(withId) };
  }, "Couldn't load events. Check your connection and Firebase setup.");
}

export async function listArchivedEvents() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, [where("IsArchived", "==", true)]);
    return { success: true, events: docs.map(withId) };
  });
}

export async function createEvent(fields) {
  return tryOp(async () => {
    const error = validate(fields);
    if (error) return { success: false, message: error };

    const id = await createDoc(COLLECTION, {
      Title: fields.title,
      EventType: fields.eventType,
      Description: fields.description || null,
      Location: fields.location,
      EventDate: fields.eventDate,
      StartTime: fields.startTime || null,
      EndTime: fields.endTime || null,
      Status: fields.status || "Draft",
      ImagePath: null,
      IsArchived: false,
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Created health event", "HealthEvent", id);
    return { success: true, eventId: id };
  }, "Couldn't create event. Check your connection and Firebase setup.");
}

export async function updateEvent(eventId, fields) {
  return tryOp(async () => {
    const error = validate(fields);
    if (error) return { success: false, message: error };

    await updateDocById(COLLECTION, eventId, {
      Title: fields.title,
      EventType: fields.eventType,
      Description: fields.description || null,
      Location: fields.location,
      EventDate: fields.eventDate,
      StartTime: fields.startTime || null,
      EndTime: fields.endTime || null,
      Status: fields.status || "Draft",
    });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

export async function archiveEvent(eventId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, eventId, { IsArchived: true });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Archived health event", "HealthEvent", eventId);
    return { success: true };
  });
}

export async function restoreEvent(eventId) {
  return tryOp(async () => {
    await updateDocById(COLLECTION, eventId, { IsArchived: false });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Restored health event", "HealthEvent", eventId);
    return { success: true };
  });
}

export async function uploadEventImage(eventId, file) {
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

    await updateDocById(COLLECTION, eventId, { ImagePath: dataUrl });
    return { success: true, imagePath: dataUrl };
  }, "Couldn't upload image. Check your connection and Firebase setup.");
}

export async function listSignups(eventId) {
  return tryOp(async () => {
    const docs = await listDocs(SIGNUPS_COLLECTION, [where("EventID", "==", eventId)]);
    return { success: true, signups: docs };
  });
}
