import { useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SurveyAnswerForm from "../../components/SurveyAnswerForm";
import {
  getSurveyToAnswer,
  submitResponse,
  viewCompletedResponse,
  watchResidentSurveys,
} from "../../api/residentSurveysLocal";
import { useLiveData } from "../../hooks/useLiveData";

export default function ResidentSurveys() {
  const [error, setError] = useState("");

  const [answering, setAnswering] = useState(null); 
  const [viewing, setViewing] = useState(null); 
  const [viewLoading, setViewLoading] = useState(false);

  const { data: liveData, loading } = useLiveData(watchResidentSurveys);
  const active = liveData?.active ?? [];
  const completed = liveData?.completed ?? [];

  async function openAnswer(surveyId) {
    setError("");
    const res = await getSurveyToAnswer(surveyId);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setAnswering(res.survey);
  }

  async function handleSubmit(answers) {
    const res = await submitResponse(answering.SurveyID, answers);
    if (res.success) setAnswering(null);
    return res;
  }

  async function openView(responseId) {
    setViewLoading(true);
    const res = await viewCompletedResponse(responseId);
    if (res.success) setViewing(res.response);
    setViewLoading(false);
  }

  if (answering) {
    return (
      <div>
        <button
          onClick={() => setAnswering(null)}
          className="mb-3 text-sm text-emerald-800 hover:underline"
        >
          ← Back to surveys
        </button>
        <h1 className="mb-1 text-2xl font-bold text-stone-900">{answering.Title}</h1>
        {answering.Description && (
          <p className="mb-6 text-sm text-stone-500">{answering.Description}</p>
        )}
        <SurveyAnswerForm
          survey={answering}
          onSubmit={handleSubmit}
          onCancel={() => setAnswering(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Surveys</h1>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
          Open Surveys
        </h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
        ) : active.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            No open surveys right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((s) => (
              <li
                key={s.SurveyID}
                className="flex items-center justify-between rounded-md border border-stone-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">{s.Title}</p>
                  {s.Description && (
                    <p className="text-xs text-stone-500">{s.Description}</p>
                  )}
                </div>
                <Button onClick={() => openAnswer(s.SurveyID)}>Answer</Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500">
          Completed Surveys
        </h2>
        {completed.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            You haven't completed any surveys yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {completed.map((s) => (
              <li
                key={s.ResponseID}
                className="flex items-center justify-between rounded-md border border-stone-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone-800">{s.Title}</p>
                  <p className="text-xs text-stone-400">Submitted {s.SubmittedAt}</p>
                </div>
                <Button variant="neutral" onClick={() => openView(s.ResponseID)}>
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(viewing) || viewLoading}
        onClose={() => setViewing(null)}
        title={viewing ? `Your response — ${viewing.FirstName} ${viewing.LastName}` : "Response"}
        maxWidth="max-w-lg"
      >
        {viewLoading ? (
          <p className="py-6 text-center text-sm text-stone-500">Loading…</p>
        ) : (
          viewing && (
            <div className="space-y-3">
              {viewing.answers.map((a) => (
                <div key={a.QuestionID} className="rounded-md border border-stone-200 p-3">
                  <p className="text-sm font-medium text-stone-800">{a.QuestionText}</p>
                  <p className="mt-1 text-sm text-stone-600">{String(a.Value)}</p>
                </div>
              ))}
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
