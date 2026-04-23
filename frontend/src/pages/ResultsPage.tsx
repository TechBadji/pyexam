import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";

interface BreakdownItem {
  question_id: string;
  statement: string;
  points: number;
  score: number | null;
  feedback: string | null;
  execution_output: string | null;
}

interface Results {
  submission_id: string;
  total_score: number;
  status: string;
  tab_switch_count: number;
  breakdown: BreakdownItem[];
}

export default function ResultsPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { t, i18n } = useTranslation("exam");
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    api
      .get<Results>(`/submissions/${submissionId}/results`)
      .then(({ data }) => setResults(data))
      .catch(() => setError("Résultats non disponibles ou correction en cours."))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const fmtScore = (v: number | null) => {
    if (v === null) return "—";
    return lang === "fr" ? v.toFixed(1).replace(".", ",") : v.toFixed(1);
  };

  const maxScore = results?.breakdown.reduce((s, b) => s + b.points, 0) ?? 0;
  const passed = results ? (results.total_score / maxScore) >= 0.5 : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mb-6 inline-block">
          ← {t("results.title")}
        </Link>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 border-2 ${passed
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("results.total_score")}</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
                    {fmtScore(results.total_score)} / {fmtScore(maxScore)}
                  </p>
                </div>
                <span className={`text-lg font-bold px-4 py-2 rounded-full ${passed
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"}`}>
                  {passed ? t("results.passed") : t("results.failed")}
                </span>
              </div>
              {results.tab_switch_count > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  {t("results.tab_switches")}: {results.tab_switch_count}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                {t("results.breakdown")}
              </h2>
              <div className="space-y-3">
                {results.breakdown.map((item, i) => (
                  <div key={item.question_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        <span className="text-gray-400 mr-2">Q{i + 1}.</span>
                        {item.statement}
                      </p>
                      <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-lg ${
                        (item.score ?? 0) >= item.points
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          : (item.score ?? 0) > 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {fmtScore(item.score)} / {fmtScore(item.points)}
                      </span>
                    </div>
                    {item.feedback && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        {item.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
