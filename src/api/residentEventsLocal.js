import {
  listDocs,
  createDoc,
  deleteDocById,
  getDocById,
  subscribeDocs,
  where,
  tryOp,
} from "./firestoreHelpers";
import { SELF_RESIDENT_ID } from "./currentResident";

const EVENTS_COLLECTION = "healthEvents";
const SIGNUPS_COLLECTION = "eventSignups";

function localToday() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function mySignupDoc(eventId) {
  const docs = await listDocs(SIGNUPS_COLLECTION, [
    where("EventID", "==", eventId),
    where("ResidentID", "==", SELF_RESIDENT_ID),
  ]);
  return docs[0] || null;
}

export async function listActiveEvents() {
  return tryOp(async () => {
    const events = await listDocs(EVENTS_COLLECTION, [where("IsArchived", "==", false)]);
    const today = localToday();
    const upcoming = events.filter(
      (e) => ["Upcoming", "Active"].includes(e.Status) && e.EventDate >= today
    );

    const withSignups = await Promise.all(
      upcoming.map(async (e) => {
        const signups = await listDocs(SIGNUPS_COLLECTION, [where("EventID", "==", e.id)]);
        return {
          ...e,
          EventID: e.id,
          isSignedUp: signups.some((s) => s.ResidentID === SELF_RESIDENT_ID),
          signupCount: signups.length,
        };
      })
    );
    return { success: true, events: withSignups };
  }, "Couldn't load events. Check your connection and Firebase setup.");
}

export function computeActiveEvents(events, signups) {
  const today = localToday();
  const upcoming = events.filter(
    (e) => ["Upcoming", "Active"].includes(e.Status) && e.EventDate >= today
  );

  return upcoming.map((e) => {
    const eventSignups = signups.filter((s) => s.EventID === e.id);
    return {
      ...e,
      EventID: e.id,
      isSignedUp: eventSignups.some((s) => s.ResidentID === SELF_RESIDENT_ID),
      signupCount: eventSignups.length,
    };
  });
}

/** Live upcoming events (with this resident's sign-up state) for the resident. */
export function watchActiveEvents(onData, onError) {
  const source = { events: [], signups: [] };
  const unsubs = [
    subscribeDocs(
      EVENTS_COLLECTION,
      [where("IsArchived", "==", false)],
      (docs) => { source.events = docs; onData(computeActiveEvents(source.events, source.signups)); },
      onError
    ),
    subscribeDocs(
      SIGNUPS_COLLECTION,
      [],
      (docs) => { source.signups = docs; onData(computeActiveEvents(source.events, source.signups)); },
      onError
    ),
  ];
  return () => unsubs.forEach((u) => u());
}

export async function signUp(eventId) {
  return tryOp(async () => {
    const event = await getDocById(EVENTS_COLLECTION, eventId);
    if (!event || event.IsArchived) return { success: false, message: "Event not found." };
    if (!["Upcoming", "Active"].includes(event.Status)) {
      return { success: false, message: "Sign-up is closed for this event." };
    }
    if (event.EventDate < localToday()) {
      return { success: false, message: "This event has already passed." };
    }
    if (await mySignupDoc(eventId)) {
      return { success: false, message: "You are already signed up for this event." };
    }

    const resident = await getDocById("residents", SELF_RESIDENT_ID);
    await createDoc(SIGNUPS_COLLECTION, {
      EventID: eventId,
      ResidentID: SELF_RESIDENT_ID,
      FirstName: resident?.FirstName || "",
      LastName: resident?.LastName || "",
      SignedUpAt: new Date().toISOString().slice(0, 10),
    });
    return { success: true };
  }, "Couldn't sign up. Check your connection and Firebase setup.");
}

export async function cancelSignup(eventId) {
  return tryOp(async () => {
    const existing = await mySignupDoc(eventId);
    if (existing) await deleteDocById(SIGNUPS_COLLECTION, existing.id);
    return { success: true };
  });
}
