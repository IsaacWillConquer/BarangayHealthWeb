import { db } from "../firebase";
import {
  collection,
  documentId,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

export { where, query, documentId };

export async function listDocs(collectionName, constraints = []) {
  const col = collection(db, collectionName);
  const q = constraints.length ? query(col, ...constraints) : col;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribes to a collection and invokes `onData` with the same shape as
 * `listDocs` every time the underlying documents change. Returns the Firestore
 * unsubscribe function so callers can clean up on unmount.
 */
export function subscribeDocs(collectionName, constraints = [], onData, onError) {
  const col = collection(db, collectionName);
  const q = constraints.length ? query(col, ...constraints) : col;
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error(err);
      onError?.(err);
    }
  );
}

export async function getDocById(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createDoc(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function setDocWithId(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), data);
  return id;
}

export async function updateDocById(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), data);
}

export async function deleteDocById(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function tryOp(fn, fallbackMessage = "Something went wrong. Please try again.") {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    return { success: false, message: fallbackMessage };
  }
}

/**
 * Atomically increments a counter document and returns the new value.
 *
 * Both the web portal and the Flutter app allocate Resident Numbers through
 * this sequence so a number created on one client can never be handed out
 * again by the other. Deriving the number from a document count instead would
 * collide as soon as either side added or removed a resident.
 */
export async function nextSequenceValue(
  collectionName,
  docId,
  field = "value",
  startAt = 0
) {
  const ref = doc(db, collectionName, docId);
  return runTransaction(db, async (txn) => {
    const snap = await txn.get(ref);
    const current = Number(snap.exists() ? snap.data()[field] : startAt);
    const next = (Number.isFinite(current) ? current : startAt) + 1;
    txn.set(ref, { [field]: next }, { merge: true });
    return next;
  });
}
