import { useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SurveyMetaModal from "../../components/SurveyMetaModal";
import QuestionFormModal from "../../components/QuestionFormModal";
import ResultsModal from "../../components/ResultsModal";
import RespondentsModal from "../../components/RespondentsModal";
import {
  createSurvey,
  updateSurveyMeta,
  activateSurvey,
  closeSurvey,
  archiveSurvey,
  restoreSurvey,
  deleteSurvey,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  watchSurveys,
  watchSurveyDetail,
  watchSurveyResults,
  watchRespondents,
} from "../../api/surveysLocal";
import { useLiveData } from "../../hooks/useLiveData";

const listColumns = [
  { key: "Title", label: "Title" },
  {
    key: "Status",
    label: "Status",
    render: (s) => <StatusBadge status={s.Status} />,
  },
  { key: "participantCount", label: "Responses" },
  { key: "OpenAt", label: "Opens" },
  { key: "CloseAt", label: "Closes" },
];

const questionTypeLabels = {
  MultipleChoice: "Multiple choice",
  YesNo: "Yes / No",
  Rating: "Rating",
  ShortAnswer: "Short answer",
};

export default function SurveyManagement() {
  const [archivedOpen, setArchivedOpen] = useState(false);

  const [metaOpen, setMetaOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);

  const [selectedId, setSelectedId] = useState(null);

  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [resultsOpen, setResultsOpen] = useState(false);
  const [respondentsOpen, setRespondentsOpen] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const liveSurveys = useLiveData(watchSurveys);
  const surveys = liveSurveys.data?.surveys ?? [];
  const archived = liveSurveys.data?.archived ?? [];
  const loading = liveSurveys.loading;

  const liveDetail = useLiveData(
    (onData, onError) =>
      selectedId ? watchSurveyDetail(selectedId, onData, onError) : () => {},
    [selectedId]
  );
  const selected = liveDetail.data;

  const liveResults = useLiveData(
    (onData, onError) =>
      resultsOpen && selectedId ? watchSurveyResults(selectedId, onData, onError) : () => {},
    [resultsOpen, selectedId]
  );
  const results = liveResults.data ?? [];

  const liveRespondents = useLiveData(
    (onData, onError) =>
      respondentsOpen && selectedId ? watchRespondents(selectedId, onData, onError) : () => {},
    [respondentsOpen, selectedId]
  );
  const respondents = liveRespondents.data ?? [];

  function openCreate() {
    setEditingSurvey(null);
    setMetaOpen(true);
  }

  function openEditMeta(survey) {
    setEditingSurvey(survey);
    setMetaOpen(true);
  }

  async function handleMetaSubmit(fields) {
    const res = editingSurvey
      ? await updateSurveyMeta(editingSurvey.SurveyID, fields)
      : await createSurvey(fields);
    if (res.success) setMetaOpen(false);
    return res;
  }

  function openManage(survey) {
    setSelectedId(survey.SurveyID);
  }

  function openAddQuestion() {
    setEditingQuestion(null);
    setQuestionFormOpen(true);
  }

  function openEditQuestion(q) {
    setEditingQuestion(q);
    setQuestionFormOpen(true);
  }

  async function handleQuestionSubmit(fields) {
    const res = editingQuestion
      ? await updateQuestion(editingQuestion.QuestionID, fields)
      : await addQuestion(selected.SurveyID, fields);
    if (res.success) setQuestionFormOpen(false);
    return res;
  }

  async function handleDeleteQuestion(q) {
    setConfirmAction({
      type: "deleteQuestion",
      label: `Delete "${q.QuestionText.slice(0, 60)}"?`,
      run: () => deleteQuestion(q.QuestionID),
    });
  }

  function openResults(survey) {
    setSelectedId(survey.SurveyID);
    setResultsOpen(true);
  }

  function openRespondents(survey) {
    setSelectedId(survey.SurveyID);
    setRespondentsOpen(true);
  }

  function confirmSurveyAction(type, survey) {
    const configs = {
      activate: {
        label: `Activate "${survey.Title}"? Residents will be able to respond.`,
        run: () => activateSurvey(survey.SurveyID),
      },
      close: {
        label: `Close "${survey.Title}"? No more responses will be accepted.`,
        run: () => closeSurvey(survey.SurveyID),
      },
      archive: {
        label: `Archive "${survey.Title}"?`,
        run: () => archiveSurvey(survey.SurveyID),
      },
      restore: {
        label: `Restore "${survey.Title}" back to Closed?`,
        run: () => restoreSurvey(survey.SurveyID),
      },
      delete: {
        label: `Delete draft "${survey.Title}"? This can't be undone.`,
        run: () => deleteSurvey(survey.SurveyID),
      },
    };
    setConfirmAction({ type, survey, ...configs[type] });
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const res = await confirmAction.run();
      if (res.success) setConfirmAction(null);
    } finally {
      setConfirmLoading(false);
    }
  }

  if (selectedId && !selected) {
    return <p className="py-8 text-center text-sm text-stone-500">Loading survey…</p>;
  }

    if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="mb-3 text-sm text-emerald-800 hover:underline"
        >
          ← Back to surveys
        </button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone-900">
                {selected.Title}
              </h1>
              <StatusBadge status={selected.Status} />
            </div>
            {selected.Description && (
              <p className="mt-1 max-w-xl text-sm text-stone-500">
                {selected.Description}
              </p>
            )}
            <p className="mt-1 text-xs text-stone-400">
              {selected.OpenAt || "no open date"} – {selected.CloseAt || "no close date"} ·{" "}
              {selected.participantCount} response
              {selected.participantCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="neutral" onClick={() => openEditMeta(selected)}>
              Edit Details
            </Button>
            {selected.Status === "Draft" && (
              <Button onClick={() => confirmSurveyAction("activate", selected)}>
                Activate
              </Button>
            )}
            {selected.Status === "Active" && (
              <Button
                variant="dangerSolid"
                onClick={() => confirmSurveyAction("close", selected)}
              >
                Close
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="neutral" onClick={() => openResults(selected)}>
            View Results
          </Button>
          <Button variant="neutral" onClick={() => openRespondents(selected)}>
            View Respondents
          </Button>
        </div>

        <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
              Questions
            </h2>
            {selected.participantCount === 0 && (
              <Button onClick={openAddQuestion}>+ Add Question</Button>
            )}
          </div>

          {selected.participantCount > 0 && (
            <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This survey already has responses, so questions can no longer be
              added, edited, or deleted.
            </p>
          )}

          {selected.questions.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              No questions yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {selected.questions.map((q, i) => (
                <li
                  key={q.QuestionID}
                  className="flex items-start justify-between gap-4 rounded-md border border-stone-200 p-3"
                >
                  <div>
                    <p className="text-sm text-stone-800">
                      <span className="text-stone-400">{i + 1}.</span>{" "}
                      {q.QuestionText}
                      {q.IsRequired && <span className="text-red-500"> *</span>}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {questionTypeLabels[q.Type]}
                      {q.Type === "MultipleChoice" &&
                        ` · ${q.Choices.map((c) => c.ChoiceText).join(", ")}`}
                      {q.Type === "Rating" &&
                        ` · ${q.RatingMin}–${q.RatingMax} (step ${q.RatingStep})`}
                    </p>
                  </div>
                  {selected.participantCount === 0 && (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="primary" onClick={() => openEditQuestion(q)}>
                        Edit
                      </Button>
                      <Button
                        variant="dangerSolid"
                        onClick={() => handleDeleteQuestion(q)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        <SurveyMetaModal
          open={metaOpen}
          survey={editingSurvey}
          onClose={() => setMetaOpen(false)}
          onSubmit={handleMetaSubmit}
        />
        <QuestionFormModal
          open={questionFormOpen}
          question={editingQuestion}
          onClose={() => setQuestionFormOpen(false)}
          onSubmit={handleQuestionSubmit}
        />
        <ResultsModal
          open={resultsOpen}
          survey={selected}
          results={results}
          loading={liveResults.loading}
          onClose={() => setResultsOpen(false)}
        />
        <RespondentsModal
          open={respondentsOpen}
          survey={selected}
          respondents={respondents}
          loading={liveRespondents.loading}
          onClose={() => setRespondentsOpen(false)}
        />
        <ConfirmDialog
          open={Boolean(confirmAction)}
          loading={confirmLoading}
          title="Please confirm"
          message={confirmAction?.label}
          confirmVariant={confirmAction?.type === "delete" ? "dangerSolid" : "primary"}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
        />
      </div>
    );
  }

    return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Survey Management</h1>
        <Button onClick={openCreate}>+ New Survey</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading surveys…
            </p>
          ) : (
            <DataTable
              columns={listColumns}
              rows={surveys.map((s) => ({ id: s.SurveyID, ...s }))}
              emptyMessage="No surveys yet."
              renderActions={(s) => (
                <>
                  <Button variant="primary" onClick={() => openManage(s)}>
                    Manage
                  </Button>
                  {s.Status === "Draft" && (
                    <Button
                      variant="dangerSolid"
                      onClick={() => confirmSurveyAction("delete", s)}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="dangerSolid"
                    onClick={() => confirmSurveyAction("archive", s)}
                  >
                    Archive
                  </Button>
                </>
              )}
            />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <button
          onClick={() => setArchivedOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800"
        >
          <span className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}>
            ▸
          </span>
          Archived Surveys ({archived.length})
        </button>

        {archivedOpen && (
          <div className="mt-4 overflow-x-auto border-t border-stone-100 pt-4">
            <DataTable
              columns={listColumns}
              rows={archived.map((s) => ({ id: s.SurveyID, ...s }))}
              emptyMessage="No archived surveys."
              renderActions={(s) => (
                <Button
                  variant="primary"
                  onClick={() => confirmSurveyAction("restore", s)}
                >
                  Restore
                </Button>
              )}
            />
          </div>
        )}
      </div>

      <SurveyMetaModal
        open={metaOpen}
        survey={editingSurvey}
        onClose={() => setMetaOpen(false)}
        onSubmit={handleMetaSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        loading={confirmLoading}
        title="Please confirm"
        message={confirmAction?.label}
        confirmVariant={confirmAction?.type === "delete" ? "dangerSolid" : "primary"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
