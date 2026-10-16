import {
  listDocs,
  getDocById,
  createDoc,
  updateDocById,
  deleteDocById,
  subscribeDocs,
  where,
  documentId,
  tryOp,
} from "./firestoreHelpers";
import { validQuestionTypes } from "../data/surveyConstants";
import { logAction } from "./logsLocal";
import { getCurrentActor } from "./currentActor";

const SURVEYS = "surveys";
const QUESTIONS = "surveyQuestions";
const RESPONSES = "surveyResponses";

async function responsesFor(surveyId) {
  return listDocs(RESPONSES, [where("SurveyID", "==", surveyId)]);
}

async function questionsFor(surveyId) {
  const docs = await listDocs(QUESTIONS, [where("SurveyID", "==", surveyId)]);
  return docs.sort((a, b) => a.OrderIndex - b.OrderIndex);
}
export async function listSurveys() {
  return tryOp(async () => {
    const [surveys, responses] = await Promise.all([listDocs(SURVEYS), listDocs(RESPONSES)]);
    return { success: true, surveys: computeSurveyList(surveys, responses, false) };
  }, "Couldn't load surveys. Check your connection and Firebase setup.");
}

export async function listArchivedSurveys() {
  return tryOp(async () => {
    const [surveys, responses] = await Promise.all([listDocs(SURVEYS), listDocs(RESPONSES)]);
    const rows = computeSurveyList(surveys, responses, true);
    return { success: true, rows, total: rows.length };
  });
}

export async function createSurvey(fields) {
  return tryOp(async () => {
    const { title, description, openAt, closeAt } = fields;
    if (!title) return { success: false, message: "Title is required." };
    if (title.length > 200) return { success: false, message: "Title must be 200 characters or fewer." };
    if (description && description.length > 1000) {
      return { success: false, message: "Description must be 1000 characters or fewer." };
    }
    if (openAt && closeAt && closeAt <= openAt) {
      return { success: false, message: "Close date must be after open date." };
    }
    const id = await createDoc(SURVEYS, {
      Title: title,
      Description: description || "",
      OpenAt: openAt || null,
      CloseAt: closeAt || null,
      Status: "Draft",
    });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Created survey", "Survey", id);
    return { success: true, surveyId: id };
  }, "Couldn't create survey. Check your connection and Firebase setup.");
}

export async function updateSurveyMeta(surveyId, fields) {
  return tryOp(async () => {
    const { title, description, openAt, closeAt } = fields;
    if (!title) return { success: false, message: "Title is required." };
    if (title.length > 200) return { success: false, message: "Title must be 200 characters or fewer." };
    if (description && description.length > 1000) {
      return { success: false, message: "Description must be 1000 characters or fewer." };
    }
    await updateDocById(SURVEYS, surveyId, {
      Title: title,
      Description: description || "",
      OpenAt: openAt || null,
      CloseAt: closeAt || null,
    });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

export async function getSurveyDetail(surveyId) {
  return tryOp(async () => {
    const survey = await getDocById(SURVEYS, surveyId);
    if (!survey) return { success: false, message: "Survey not found." };
    const [questions, responses] = await Promise.all([
      questionsFor(surveyId),
      responsesFor(surveyId),
    ]);
    return { success: true, survey: computeSurveyDetail(survey, questions, responses) };
  }, "Couldn't load survey. Check your connection and Firebase setup.");
}

export async function activateSurvey(surveyId) {
  return tryOp(async () => {
    const questions = await questionsFor(surveyId);
    if (questions.length === 0) {
      return { success: false, message: "Add at least one question before activating." };
    }
    await updateDocById(SURVEYS, surveyId, { Status: "Active" });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Activated survey", "Survey", surveyId);
    return { success: true };
  });
}

export async function closeSurvey(surveyId) {
  return tryOp(async () => {
    await updateDocById(SURVEYS, surveyId, { Status: "Closed" });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Closed survey", "Survey", surveyId);
    return { success: true };
  });
}

export async function archiveSurvey(surveyId) {
  return tryOp(async () => {
    await updateDocById(SURVEYS, surveyId, { Status: "Archived" });
    const { type, id: actorId } = getCurrentActor();
    logAction(type, actorId, "Archived survey", "Survey", surveyId);
    return { success: true };
  });
}

export async function restoreSurvey(surveyId) {
  return tryOp(async () => {
    await updateDocById(SURVEYS, surveyId, { Status: "Closed" }); 
    return { success: true };
  });
}

export async function deleteSurvey(surveyId) {
  return tryOp(async () => {
    if ((await responsesFor(surveyId)).length > 0) {
      return {
        success: false,
        message: "Cannot delete a survey that already has responses — archive it instead.",
      };
    }
    const questions = await questionsFor(surveyId);
    await Promise.all(questions.map((q) => deleteDocById(QUESTIONS, q.id)));
    await deleteDocById(SURVEYS, surveyId);
    return { success: true };
  });
}
function validateQuestion(fields) {
  const { questionText, type, choices } = fields;
  if (!validQuestionTypes.includes(type)) return "Invalid question type.";
  if (!questionText) return "Question text is required.";
  if (questionText.length > 500) return "Question text must be 500 characters or fewer.";
  if (type === "MultipleChoice") {
    const nonEmpty = (choices || []).filter((c) => c.trim() !== "");
    if (nonEmpty.length < 2) return "Multiple choice questions need at least 2 choices.";
    if (nonEmpty.some((c) => c.length > 255)) return "Each choice must be 255 characters or fewer.";
  }
  return null;
}

function toChoices(fields) {
  return fields.type === "MultipleChoice"
    ? (fields.choices || [])
        .filter((c) => c.trim() !== "")
        .map((text, i) => ({ ChoiceID: `c${i}`, ChoiceText: text.trim(), OrderIndex: i }))
    : [];
}

export async function addQuestion(surveyId, fields) {
  return tryOp(async () => {
    if ((await responsesFor(surveyId)).length > 0) {
      return { success: false, message: "Cannot add questions once a survey has responses." };
    }
    const error = validateQuestion(fields);
    if (error) return { success: false, message: error };

    const orderIndex = (await questionsFor(surveyId)).length;
    const id = await createDoc(QUESTIONS, {
      SurveyID: surveyId,
      QuestionText: fields.questionText,
      Type: fields.type,
      IsRequired: Boolean(fields.isRequired),
      OrderIndex: orderIndex,
      RatingMin: fields.type === "Rating" ? Number(fields.ratingMin) : null,
      RatingMax: fields.type === "Rating" ? Number(fields.ratingMax) : null,
      RatingStep: fields.type === "Rating" ? Number(fields.ratingStep) || 1 : null,
      Choices: toChoices(fields),
    });
    return { success: true, questionId: id };
  }, "Couldn't add question. Check your connection and Firebase setup.");
}

export async function updateQuestion(questionId, fields) {
  return tryOp(async () => {
    const question = await getDocById(QUESTIONS, questionId);
    if (!question) return { success: false, message: "Question not found." };
    if ((await responsesFor(question.SurveyID)).length > 0) {
      return {
        success: false,
        message:
          "This survey already has responses, so its questions can no longer be edited. Close it and create a new survey instead.",
      };
    }
    const error = validateQuestion(fields);
    if (error) return { success: false, message: error };

    await updateDocById(QUESTIONS, questionId, {
      QuestionText: fields.questionText,
      Type: fields.type,
      IsRequired: Boolean(fields.isRequired),
      RatingMin: fields.type === "Rating" ? Number(fields.ratingMin) : null,
      RatingMax: fields.type === "Rating" ? Number(fields.ratingMax) : null,
      RatingStep: fields.type === "Rating" ? Number(fields.ratingStep) || 1 : null,
      Choices: toChoices(fields),
    });
    return { success: true };
  }, "Couldn't save changes. Check your connection and Firebase setup.");
}

export async function deleteQuestion(questionId) {
  return tryOp(async () => {
    const question = await getDocById(QUESTIONS, questionId);
    if (!question) return { success: false, message: "Question not found." };
    if ((await responsesFor(question.SurveyID)).length > 0) {
      return {
        success: false,
        message:
          "This survey already has responses, so its questions can no longer be deleted. Close it and create a new survey instead.",
      };
    }
    await deleteDocById(QUESTIONS, questionId);
    return { success: true };
  });
}
export async function getSurveyResults(surveyId) {
  return tryOp(async () => {
    const [questions, responses] = await Promise.all([
      questionsFor(surveyId),
      responsesFor(surveyId),
    ]);
    return { success: true, results: computeResults(questions, responses) };
  }, "Couldn't load results. Check your connection and Firebase setup.");
}

export async function getRespondents(surveyId) {
  return tryOp(async () => {
    const responses = await responsesFor(surveyId);
    return { success: true, respondents: computeRespondents(responses) };
  });
}

export function computeSurveyList(surveys, responses, archived) {
  return surveys
    .filter((s) => (archived ? s.Status === "Archived" : s.Status !== "Archived"))
    .map((s) => ({
      ...s,
      SurveyID: s.id,
      participantCount: responses.filter((r) => r.SurveyID === s.id).length,
    }));
}

export function computeSurveyDetail(survey, questions, responses) {
  return {
    ...survey,
    SurveyID: survey.id,
    questions: [...questions]
      .sort((a, b) => a.OrderIndex - b.OrderIndex)
      .map((q) => ({ ...q, QuestionID: q.id })),
    participantCount: responses.filter((r) => r.SurveyID === survey.id).length,
  };
}

export function computeResults(questions, responses) {
  return [...questions]
    .sort((a, b) => a.OrderIndex - b.OrderIndex)
    .map((q) => {
      const tally = {};
      let totalResponses = 0;
      const rawAnswers = [];
      let sum = 0;
      let n = 0;

      for (const r of responses) {
        const ans = (r.Answers || []).find((a) => a.QuestionID === q.id);
        if (!ans) continue;

        if (q.Type === "Rating" && ans.RatingValue != null) {
          tally[ans.RatingValue] = (tally[ans.RatingValue] || 0) + 1;
          sum += ans.RatingValue;
          n++;
          totalResponses++;
        } else if (q.Type === "ShortAnswer") {
          if (ans.AnswerText) rawAnswers.push(ans.AnswerText);
          totalResponses++;
        } else if (ans.AnswerText) {
          tally[ans.AnswerText] = (tally[ans.AnswerText] || 0) + 1;
          totalResponses++;
        }
      }

      return {
        QuestionID: q.id,
        QuestionText: q.QuestionText,
        Type: q.Type,
        tally: Object.entries(tally).map(([value, count]) => ({ value, count })),
        totalResponses,
        average: q.Type === "Rating" && n > 0 ? Math.round((sum / n) * 100) / 100 : null,
        rawAnswers: q.Type === "ShortAnswer" ? rawAnswers : undefined,
      };
    });
}

export function computeRespondents(responses) {
  return [...responses]
    .map((r) => ({
      ResponseID: r.id,
      ResidentID: r.ResidentID,
      FirstName: r.FirstName,
      LastName: r.LastName,
      SubmittedAt: r.SubmittedAt,
    }))
    .sort((a, b) => (a.SubmittedAt < b.SubmittedAt ? 1 : -1));
}

/** Live list of active + archived surveys with real-time response counts. */
export function watchSurveys(onData, onError) {
  const source = { surveys: [], responses: [] };

  function emit() {
    onData({
      surveys: computeSurveyList(source.surveys, source.responses, false),
      archived: computeSurveyList(source.surveys, source.responses, true),
    });
  }

  const unsubs = [
    subscribeDocs(SURVEYS, [], (docs) => { source.surveys = docs; emit(); }, onError),
    subscribeDocs(RESPONSES, [], (docs) => { source.responses = docs; emit(); }, onError),
  ];
  return () => unsubs.forEach((u) => u());
}

/** Live detail for a single survey (questions + participant count). */
export function watchSurveyDetail(surveyId, onData, onError) {
  const source = { survey: null, questions: [], responses: [] };

  function emit() {
    if (!source.survey) return;
    onData(computeSurveyDetail(source.survey, source.questions, source.responses));
  }

  const unsubs = [
    subscribeDocs(SURVEYS, [where(documentId(), "==", surveyId)], (docs) => {
      source.survey = docs[0] || null;
      emit();
    }, onError),
    subscribeDocs(QUESTIONS, [where("SurveyID", "==", surveyId)], (docs) => {
      source.questions = docs;
      emit();
    }, onError),
    subscribeDocs(RESPONSES, [where("SurveyID", "==", surveyId)], (docs) => {
      source.responses = docs;
      emit();
    }, onError),
  ];
  return () => unsubs.forEach((u) => u());
}

/** Live aggregated results for a survey. */
export function watchSurveyResults(surveyId, onData, onError) {
  const source = { questions: [], responses: [] };
  const unsubs = [
    subscribeDocs(QUESTIONS, [where("SurveyID", "==", surveyId)], (docs) => {
      source.questions = docs;
      onData(computeResults(source.questions, source.responses));
    }, onError),
    subscribeDocs(RESPONSES, [where("SurveyID", "==", surveyId)], (docs) => {
      source.responses = docs;
      onData(computeResults(source.questions, source.responses));
    }, onError),
  ];
  return () => unsubs.forEach((u) => u());
}

/** Live respondent list for a survey. */
export function watchRespondents(surveyId, onData, onError) {
  return subscribeDocs(
    RESPONSES,
    [where("SurveyID", "==", surveyId)],
    (docs) => onData(computeRespondents(docs)),
    onError
  );
}

export async function getRespondentAnswers(responseId) {
  return tryOp(async () => {
    const response = await getDocById(RESPONSES, responseId);
    if (!response) return { success: false, message: "Response not found." };
    const questions = await questionsFor(response.SurveyID);

    const answers = (response.Answers || []).map((a) => {
      const q = questions.find((q) => q.id === a.QuestionID);
      return {
        QuestionID: a.QuestionID,
        QuestionText: q?.QuestionText || "",
        Type: q?.Type,
        Value: q?.Type === "Rating" ? a.RatingValue : a.AnswerText || "(no answer)",
      };
    });

    return {
      success: true,
      response: {
        ResponseID: response.id,
        FirstName: response.FirstName,
        LastName: response.LastName,
        SubmittedAt: response.SubmittedAt,
        answers,
      },
    };
  }, "Couldn't load response. Check your connection and Firebase setup.");
}
