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
import WatermarkOverlay from "../components/exam/WatermarkOverlay";
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
  const [fullscreenExited, setFullscreenExited] = useState(false);
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
        // crypto.randomUUID() requires HTTPS in some browsers — use a safe fallback
        token = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
            });
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
    load().catch((err) => {
      console.error("[ExamPage] load failed:", err?.response?.status, err?.message);
      toast.error(t("interface.load_error") ?? "Erreur de chargement. Rechargez la page.");
      setLoading(false);
    });
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

  // Heartbeat toutes les 30s — permet de détecter les déconnexions > 60s côté serveur
  useEffect(() => {
    if (!submissionId || isSubmitted) return;
    const id = setInterval(() => {
      api.put(`/submissions/${submissionId}/heartbeat`).catch(() => undefined);
    }, 30_000);
    return () => clearInterval(id);
  }, [submissionId, isSubmitted]);

  // Journal d'activité détaillé
  const logActivity = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      if (!submissionId || isSubmitted) return;
      const body = { action, ...data };
      api.post(`/submissions/${submissionId}/activity`, body).catch(() =>
        enqueue(`/submissions/${submissionId}/activity`, "post", body)
      );
    },
    [submissionId, isSubmitted]
  );

  useEffect(() => {
    if (!submissionId || isSubmitted) return;

    const onBlur  = () => logActivity("WINDOW_BLUR");
    const onFocus = () => logActivity("WINDOW_FOCUS");
    const onCopy  = () => logActivity("COPY_ATTEMPT");
    const onPaste = () => logActivity("PASTE_ATTEMPT");
    const onCut   = () => logActivity("CUT_ATTEMPT");

    window.addEventListener("blur",  onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("copy",  onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("cut",   onCut);
    return () => {
      window.removeEventListener("blur",  onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("copy",  onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("cut",   onCut);
    };
  }, [submissionId, isSubmitted, logActivity]);

  // Plein écran forcé
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  useEffect(() => {
    if (isSubmitted) return;
    // Tenter le plein écran dès le chargement (fonctionne si la page vient d'un clic utilisateur)
    enterFullscreen();
  }, [isSubmitted]);

  useEffect(() => {
    if (isSubmitted) return;
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      if (!isFs && submissionId) {
        setFullscreenExited(true);
        api.post(`/submissions/${submissionId}/fullscreen_exit`).catch(() =>
          enqueue(`/submissions/${submissionId}/fullscreen_exit`, "post", {})
        );
      } else {
        setFullscreenExited(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
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
      // Flush offline queue + force-save all in-memory answers so no pending
      // debounce or failed request is lost when the student clicks Submit.
      await flushQueue().catch(() => undefined);
      await Promise.all(
        Object.entries(answers).map(([qId, ans]) =>
          api.put(`/submissions/${submissionId}/answers/${qId}`, ans).catch(() => undefined)
        )
      );
      await api.post(`/submissions/${submissionId}/submit`);
      markSubmitted();
      toast.success(t("interface.auto_submitted"));
      navigate(`/results/${submissionId}`);
    } finally {
      setSubmitting(false);
    }
  }, [submissionId, submitting, isSubmitted, examId, answers]);

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
      {user && <WatermarkOverlay name={user.full_name} studentNumber={user.student_number} />}

      {fullscreenExited && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("interface.fullscreen_exit_title") ?? "Sortie du plein écran détectée"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("interface.fullscreen_exit_body") ?? "Cette action a été enregistrée. Reprenez le plein écran pour continuer votre examen."}
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              {t("interface.fullscreen_resume") ?? "Reprendre en plein écran"}
            </button>
          </div>
        </div>
      )}

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
              onCodeUpdate={(code) => setAnswer(question.id, { code_written: code })}
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
