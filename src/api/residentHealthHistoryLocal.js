import { listDocs, subscribeDocs, where, tryOp } from "./firestoreHelpers";
import { SELF_RESIDENT_ID } from "./currentResident";

const COLLECTION = "healthHistory";

const myHistoryConstraints = () => [
  where("ResidentID", "==", SELF_RESIDENT_ID),
  where("IsVoided", "==", false),
];

function withRecordIds(docs) {
  return docs.map((d) => ({ ...d, RecordID: d.id }));
}

export async function listMyHistory() {
  return tryOp(async () => {
    const docs = await listDocs(COLLECTION, myHistoryConstraints());
    return { success: true, records: withRecordIds(docs) };
  }, "Couldn't load your health history. Check your connection and Firebase setup.");
}

export function watchMyHistory(onData, onError) {
  return subscribeDocs(
    COLLECTION,
    myHistoryConstraints(),
    (docs) => onData(withRecordIds(docs)),
    onError
  );
}
