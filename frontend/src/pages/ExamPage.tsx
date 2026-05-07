import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import CodingQuestion from "../components/exam/CodingQuestion";
import ExamTimer from "../components/exam/ExamTimer";
import MCQQuestion from "../components/exam/MCQQuestion";
import QuestionNav from "../components/exam/QuestionNav";
import { enqueue, flushQueue, initOfflineSync } from "../components/exam/OfflineQueue";
import Navbar from "../components/ui/Navbar";
import OfflineBanner from "../components/ui/OfflineBanner";
import { useAuthStore } from "../store/authStore";
import { useExamStore, type Exam } from "../store/examStore";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const { t } = useTranslation("exam");
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentExam, submissionId, startedAt, answers, isSubmitted,
    setExam, setSubmissionId, setStartedAt, setAnswer, markSubmitted, reset,
  } = useExamStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tabWarned = useRef(false);

  useEffect(() => {
    initOfflineSync();
  }, []);

  useEffect(() => {
    if (!examId) return;
    reset();
    const tokenKey = `pyexam_token_${examId}_${user?.id}`;
    const load = async () => {
      const { data: exam } = await api.get<Exam>(`/exams/${examId}`);
      setExam(exam);

      // Reuse the same token across refreshes so the same submission is found
      let token = localStorage.getItem(tokenKey);
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem(tokenKey, token);
      }

      const { data: startData } = await api.post<{
        submission_id: string;
        started_at: string;
        status: string;
        answers: { question_id: string; selected_option_id: string | null; code_written: string | null }[];
      }>(`/exams/${examId}/start`, { submission_token: token });

      // Already submitted — go straight to results
      if (startData.status === "submitted" || startData.status === "corrected") {
        navigate(`/results/${startData.submission_id}`, { replace: true });
        return;
      }

      setSubmissionId(startData.submission_id);
      setStartedAt(new Date(startData.started_at));

      // Restore saved answers into the store
      for (const a of startData.answers) {
        const draft: { selected_option_id?: string; code_written?: string } = {};
        if (a.selected_option_id) draft.selected_option_id = a.selected_option_id;
        if (a.code_written) draft.code_written = a.code_written;
        if (Object.keys(draft).length > 0) setAnswer(a.question_id, draft);
      }

      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [examId]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden && submissionId && !isSubmitted) {
        tabWarned.current = true;
        toast(t("interface.tab_switch_warning"), { icon: "⚠️", duration: 5000 });
        api.post(`/submissions/${submissionId}/tab_switch`).catch(() =>
          enqueue(`/submissions/${submissionId}/tab_switch`, "post", {})
        );
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [submissionId, isSubmitted]);

  const saveAnswer = useCallback(
    async (questionId: string, data: { selected_option_id?: string; code_written?: string }) => {
      if (!submissionId || isSubmitted) return;
      setAnswer(questionId, data);
      try {
        await api.put(`/submissions/${submissionId}/answers/${questionId}`, data);
        flushQueue().catch(() => undefined);
      } catch {
        enqueue(`/submissions/${submissionId}/answers/${questionId}`, "put", data);
      }
    },
    [submissionId, isSubmitted]
  );

  const doSubmit = useCallback(async () => {
    if (!submissionId || submitting || isSubmitted) return;
    setSubmitting(true);
    try {
      await api.post(`/submissions/${submissionId}/submit`);
      markSubmitted();
      toast.success(t("interface.auto_submitted"));
      navigate(`/results/${submissionId}`);
    } finally {
      setSubmitting(false);
    }
  }, [submissionId, submitting, isSubmitted, examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentExam) return null;
  const question = currentExam.questions[currentIndex];
  const answeredIds = new Set(
    Object.entries(answers)
      .filter(([, v]) => v.selected_option_id ?? v.code_written)
      .map(([k]) => k)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <OfflineBanner />

      <header className="sticky top-14 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
            {currentExam.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            {startedAt && (
              <ExamTimer
                durationMinutes={currentExam.duration_minutes}
                startedAt={startedAt}
                onExpire={doSubmit}
              />
            )}
            {!isSubmitted && (
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("interface.submit_exam")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <QuestionNav
          questions={currentExam.questions}
          currentIndex={currentIndex}
          answeredIds={answeredIds}
          onSelect={setCurrentIndex}
        />

        <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {t("common:labels.question", { ns: "common" })} {currentIndex + 1} / {currentExam.questions.length}
            </span>
          </div>

          {question.type === "mcq" ? (
            <MCQQuestion
              key={question.id}
              question={question}
              selectedOptionId={answers[question.id]?.selected_option_id}
              readOnly={isSubmitted}
              onAnswer={(optionId) => saveAnswer(question.id, { selected_option_id: optionId })}
            />
          ) : (
            <CodingQuestion
              key={question.id}
              question={question}
              initialCode={answers[question.id]?.code_written}
              readOnly={isSubmitted}
              onCodeChange={(code) => saveAnswer(question.id, { code_written: code })}
            />
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-brand-600 transition-colors"
            >
              ← {tCommon("buttons.previous")}
            </button>
            <button
              disabled={currentIndex === currentExam.questions.length - 1}
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-brand-600 transition-colors"
            >
              {tCommon("buttons.next")} →
            </button>
          </div>
        </div>
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("interface.confirm_submit_title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("interface.confirm_submit_body")}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {tCommon("buttons.cancel")}
              </button>
              <button
                onClick={() => { setShowConfirm(false); doSubmit(); }}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? "..." : t("interface.submit_exam")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
