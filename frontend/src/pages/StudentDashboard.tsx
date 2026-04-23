import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";
import { useAuthStore } from "../store/authStore";

interface ExamCard {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  status: string;
  seconds_until_start: number;
  seconds_until_end: number;
}

function fmtCountdown(secs: number, t: (k: string) => string): string {
  if (secs <= 0) return t("dashboard.started");
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function StudentDashboard() {
  const { t } = useTranslation("exam");
  const { user } = useAuthStore();
  const [exams, setExams] = useState<ExamCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ExamCard[]>("/exams/available")
      .then(({ data }) => setExams(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {t("dashboard.welcome", { name: user?.full_name ?? "" })}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t("dashboard.available_exams")}
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            {t("dashboard.no_exams")}
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => {
              const hasStarted = exam.seconds_until_start <= 0;
              const hasEnded = exam.seconds_until_end <= 0;
              return (
                <div
                  key={exam.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                      {exam.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {exam.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {exam.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!hasStarted && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full font-medium">
                        {t("dashboard.starts_in")} {fmtCountdown(exam.seconds_until_start, t)}
                      </span>
                    )}
                    {hasEnded ? (
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {t("dashboard.closed")}
                      </span>
                    ) : hasStarted ? (
                      <Link
                        to={`/exam/${exam.id}`}
                        className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
                      >
                        {t("dashboard.enter_exam")}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
