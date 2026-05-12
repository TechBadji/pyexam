import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";

interface TestResult {
  input: string;
  expected_output: string;
  actual_output: string | null;
  passed: boolean;
}

interface BreakdownItem {
  question_id: string;
  question_type: "mcq" | "coding";
  statement: string;
  points: number;
  score: number | null;
  feedback: string | null;
  code_written?: string | null;
  test_results?: TestResult[];
}

interface Results {
  submission_id: string;
  total_score: number;
  max_score: number;
  grade_scale: number | null;
  scaled_score: number | null;
  passing_threshold: number;
  passed: boolean | null;
  status: string;
  tab_switch_count: number;
  breakdown: BreakdownItem[];
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 dark:bg-gray-950 text-green-300 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre font-mono leading-relaxed">
      {code}
    </pre>
  );
}

function TestResultsTable({ results, t }: { results: TestResult[]; t: (k: string) => string }) {
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === results.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {t("results.test_results")}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          allPassed
            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        }`}>
          {passedCount} / {results.length}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-8">#</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("results.col_input")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("results.col_expected")}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("results.col_got")}</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16">{t("results.col_status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {results.map((r, i) => (
              <tr key={i} className={r.passed ? "bg-green-50/40 dark:bg-green-900/10" : "bg-red-50/40 dark:bg-red-900/10"}>
                <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                <td className="px-3 py-2">
                  <pre className="font-mono whitespace-pre text-gray-700 dark:text-gray-300">{r.input || "—"}</pre>
                </td>
                <td className="px-3 py-2">
                  <pre className="font-mono whitespace-pre text-gray-700 dark:text-gray-300">{r.expected_output || "—"}</pre>
                </td>
                <td className="px-3 py-2">
                  <pre className={`font-mono whitespace-pre ${
                    r.passed
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {r.actual_output != null ? r.actual_output : <span className="italic text-gray-400">{t("results.no_output")}</span>}
                  </pre>
                </td>
                <td className="px-3 py-2 text-center">
                  {r.passed
                    ? <span className="text-green-600 dark:text-green-400 font-bold text-base">✓</span>
                    : <span className="text-red-500 dark:text-red-400 font-bold text-base">✗</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodingBreakdown({ item, t }: { item: BreakdownItem; t: (k: string) => string }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="space-y-3">
      {/* Code toggle */}
      <div>
        <button
          onClick={() => setShowCode((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showCode ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {showCode ? t("results.hide_code") : t("results.show_code")}
        </button>
        {showCode && (
          <div className="mt-2">
            {item.code_written
              ? <CodeBlock code={item.code_written} />
              : <p className="text-xs text-gray-400 italic">{t("results.no_code")}</p>
            }
          </div>
        )}
      </div>

      {/* Test results */}
      {item.test_results && item.test_results.length > 0 && (
        <TestResultsTable results={item.test_results} t={t} />
      )}
    </div>
  );
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
      .catch(() => setError(t("results.not_available")))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const fmtScore = (v: number | null, decimals = 1) => {
    if (v === null) return "—";
    return lang === "fr" ? v.toFixed(decimals).replace(".", ",") : v.toFixed(decimals);
  };

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
            {/* Score banner */}
            <div className={`rounded-2xl p-6 border-2 ${
              results.passed === true
                ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                : results.passed === false
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700"
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("results.total_score")}</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {fmtScore(results.total_score)} / {fmtScore(results.max_score)}
                  </p>
                  {results.grade_scale != null && results.scaled_score != null && (
                    <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                      {fmtScore(results.scaled_score, 2)} / {results.grade_scale}
                    </p>
                  )}
                </div>
                {results.passed !== null && (
                  <span className={`text-lg font-bold px-4 py-2 rounded-full ${
                    results.passed ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {results.passed ? t("results.passed") : t("results.failed")}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>{t("results.passing_threshold")} : {results.passing_threshold}%</span>
                {results.tab_switch_count > 0 && (
                  <span>{t("results.tab_switches")} : {results.tab_switch_count}</span>
                )}
              </div>
            </div>

            {/* Per-question breakdown */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                {t("results.breakdown")}
              </h2>
              <div className="space-y-4">
                {results.breakdown.map((item, i) => {
                  const scoreColor =
                    (item.score ?? 0) >= item.points
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      : (item.score ?? 0) > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";

                  return (
                    <div
                      key={item.question_id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                    >
                      {/* Header: statement + score */}
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          <span className="text-gray-400 mr-2">Q{i + 1}.</span>
                          {item.statement}
                        </p>
                        <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-lg ${scoreColor}`}>
                          {fmtScore(item.score)} / {fmtScore(item.points)}
                        </span>
                      </div>

                      {/* MCQ: show text feedback */}
                      {item.question_type === "mcq" && item.feedback && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                          {item.feedback}
                        </p>
                      )}

                      {/* Coding: code block + test table */}
                      {item.question_type === "coding" && (
                        <CodingBreakdown item={item} t={t} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
