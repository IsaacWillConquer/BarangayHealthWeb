import { listDocs, getDocById, createDoc, subscribeDocs, where, tryOp } from "./firestoreHelpers";
import { SELF_RESIDENT_ID } from "./currentResident";
import { logAction } from "./logsLocal";
import { getRespondentAnswers } from "./surveysLocal";

const SURVEYS = "surveys";
const QUESTIONS = "surveyQuestions";
const RESPONSES = "surveyResponses";

function localToday() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function isWithinWindow(survey) {
  if (survey.Status !== "Active") return false;
  const today = localToday();
  if (survey.OpenAt && today < survey.OpenAt) return false;
  if (survey.CloseAt && today > survey.CloseAt) return false;
  return true;
}

async function myResponses() {
  return listDocs(RESPONSES, [where("ResidentID", "==", SELF_RESIDENT_ID)]);
}

export async function getActiveSurveys() {
  return tryOp(async () => {
    const [surveys, responses] = await Promise.all([
      listDocs(SURVEYS, [where("Status", "==", "Active")]),
      myResponses(),
    ]);
    const answeredIds = new Set(responses.map((r) => r.SurveyID));
    const active = surveys
      .filter((s) => isWithinWindow(s) && !answeredIds.has(s.id))
      .map((s) => ({ ...s, SurveyID: s.id }));
    return { success: true, surveys: active };
  }, "Couldn't load surveys. Check your connection and Firebase setup.");
}

export async function getCompletedSurveys() {
  return tryOp(async () => {
    const responses = await myResponses();
    const surveys = await Promise.all(
      responses.map(async (r) => {
        const survey = await getDocById(SURVEYS, r.SurveyID);
        return {
          SurveyID: r.SurveyID,
          ResponseID: r.id,
          Title: survey?.Title || "(deleted survey)",
          SubmittedAt: r.SubmittedAt,
        };
      })
    );
    surveys.sort((a, b) => (a.SubmittedAt < b.SubmittedAt ? 1 : -1));
    return { success: true, surveys };
  }, "Couldn't load your completed surveys. Check your connection and Firebase setup.");
}

export async function getSurveyToAnswer(surveyId) {
  return tryOp(async () => {
    const already = (await myResponses()).some((r) => r.SurveyID === surveyId);
    if (already) {
      return { success: false, message: "You have already answered this survey." };
    }
    const survey = await getDocById(SURVEYS, surveyId);
    if (!survey || !isWithinWindow(survey)) {
      return { success: false, message: "This survey is not currently open." };
    }
    const questionDocs = await listDocs(QUESTIONS, [where("SurveyID", "==", surveyId)]);
    const questions = questionDocs
      .sort((a, b) => a.OrderIndex - b.OrderIndex)
      .map((q) => ({ ...q, QuestionID: q.id }));

    return { success: true, survey: { ...survey, SurveyID: survey.id, questions } };
  }, "Couldn't load the survey. Check your connection and Firebase setup.");
}

export async function submitResponse(surveyId, answers) {
  return tryOp(async () => {
    const already = (await myResponses()).some((r) => r.SurveyID === surveyId);
    if (already) {
      return { success: false, message: "You have already submitted a response for this survey." };
    }
    const survey = await getDocById(SURVEYS, surveyId);
    if (!survey || !isWithinWindow(survey)) {
      return { success: false, message: "This survey is no longer accepting responses." };
    }

    const questionDocs = await listDocs(QUESTIONS, [where("SurveyID", "==", surveyId)]);
    const answersByQid = new Map(answers.map((a) => [a.questionId, a]));

    for (const q of questionDocs) {
      const a = answersByQid.get(q.id);
      if (a?.answerText && a.answerText.length > 1000) {
        return { success: false, message: "One of your answers is too long (max 1000 characters)." };
      }
      if (q.IsRequired) {
        const hasAnswer = a && ((a.answerText || "").trim() !== "" || a.choiceId || a.ratingValue != null);
        if (!hasAnswer) {
          return { success: false, message: "Please answer all required questions." };
        }
      }
    }

    const residentDoc = await getDocById("residents", SELF_RESIDENT_ID);
    const responseId = await createDoc(RESPONSES, {
      SurveyID: surveyId,
      ResidentID: SELF_RESIDENT_ID,
      FirstName: residentDoc?.FirstName || "",
      LastName: residentDoc?.LastName || "",
      SubmittedAt: new Date().toISOString().slice(0, 10),
      Answers: answers.map((a) => ({
        QuestionID: a.questionId,
        AnswerText: a.answerText || null,
        ChoiceID: a.choiceId || null,
        RatingValue: a.ratingValue ?? null,
      })),
    });

    logAction("Resident", SELF_RESIDENT_ID, "Submitted survey response", "Survey", surveyId);
    return { success: true, responseId };
  }, "Couldn't submit your response. Check your connection and Firebase setup.");
}

export function computeActiveSurveys(surveys, responses) {
  const answeredIds = new Set(responses.map((r) => r.SurveyID));
  return surveys
    .filter((s) => isWithinWindow(s) && !answeredIds.has(s.id))
    .map((s) => ({ ...s, SurveyID: s.id }));
}

export function computeCompletedSurveys(surveys, responses) {
  const byId = new Map(surveys.map((s) => [s.id, s]));
  return [...responses]
    .map((r) => ({
      SurveyID: r.SurveyID,
      ResponseID: r.id,
      Title: byId.get(r.SurveyID)?.Title || "(deleted survey)",
      SubmittedAt: r.SubmittedAt,
    }))
    .sort((a, b) => (a.SubmittedAt < b.SubmittedAt ? 1 : -1));
}

/** Live open/completed surveys for the signed-in resident. */
export function watchResidentSurveys(onData, onError) {
  const source = { surveys: [], responses: [] };

  function emit() {
    onData({
      active: computeActiveSurveys(source.surveys, source.responses),
      completed: computeCompletedSurveys(source.surveys, source.responses),
    });
  }

  const unsubs = [
    subscribeDocs(
      SURVEYS,
      [],
      (docs) => { source.surveys = docs; emit(); },
      onError
    ),
    subscribeDocs(
      RESPONSES,
      [where("ResidentID", "==", SELF_RESIDENT_ID)],
      (docs) => { source.responses = docs; emit(); },
      onError
    ),
  ];
  return () => unsubs.forEach((u) => u());
}

export const viewCompletedResponse = getRespondentAnswers;
