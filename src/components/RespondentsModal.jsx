import { useState } from "react";
import Modal from "./ui/Modal";
import DataTable from "./ui/DataTable";
import Button from "./ui/Button";
import { getRespondentAnswers } from "../api/surveysLocal";

const listColumns = [
  {
    key: "Name",
    label: "Resident",
    render: (r) => `${r.FirstName} ${r.LastName}`,
  },
  { key: "SubmittedAt", label: "Submitted" },
];

export default function RespondentsModal({ open, survey, respondents, loading, onClose }) {
  const [detail, setDetail] = useState(null); 
  const [detailLoading, setDetailLoading] = useState(false);

  async function openDetail(responseId) {
    setDetailLoading(true);
    const res = await getRespondentAnswers(responseId);
    if (res.success) setDetail(res.response);
    setDetailLoading(false);
  }

  function handleClose() {
    setDetail(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={survey ? `Respondents — ${survey.Title}` : "Respondents"}
      maxWidth="max-w-lg"
    >
      {detail ? (
        <div>
          <button
            onClick={() => setDetail(null)}
            className="mb-3 text-sm text-emerald-800 hover:underline"
          >
            ← Back to respondents
          </button>
          <p className="mb-3 text-sm text-stone-500">
            {detail.FirstName} {detail.LastName} · submitted {detail.SubmittedAt}
          </p>
          <div className="space-y-3">
            {detail.answers.map((a) => (
              <div key={a.QuestionID} className="rounded-md border border-stone-200 p-3">
                <p className="text-sm font-medium text-stone-800">{a.QuestionText}</p>
                <p className="mt-1 text-sm text-stone-600">{String(a.Value)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : detailLoading ? (
        <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
      ) : loading ? (
        <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
      ) : (
        <DataTable
          columns={listColumns}
          rows={(respondents || []).map((r) => ({ id: r.ResponseID, ...r }))}
          emptyMessage="No responses yet."
          renderActions={(r) => (
            <Button variant="primary" onClick={() => openDetail(r.ResponseID)}>
              View
            </Button>
          )}
        />
      )}
    </Modal>
  );
}
