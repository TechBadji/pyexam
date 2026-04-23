import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ScoreRange {
  range: string;
  count: number;
}

interface QuestionStat {
  question_id: string;
  statement: string;
  avg_score: number;
  fail_rate: number;
}

interface StatsPanelProps {
  mean: number | null;
  median: number | null;
  pass_rate: number | null;
  score_distribution: ScoreRange[];
  questions: QuestionStat[];
}

function MetricCard({ label, value, unit = "" }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value !== null ? `${value}${unit}` : "—"}
      </p>
    </div>
  );
}

export default function StatsPanel({
  mean,
  median,
  pass_rate,
  score_distribution,
  questions,
}: StatsPanelProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label={t("stats.mean")} value={mean} />
        <MetricCard label={t("stats.median")} value={median} />
        <MetricCard label={t("stats.pass_rate")} value={pass_rate} unit="%" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {t("stats.distribution")}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={score_distribution} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tw-bg-opacity, #fff)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {t("stats.hardest_questions")}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs text-gray-400 uppercase tracking-wide">Question</th>
                <th className="pb-2 text-right text-xs text-gray-400 uppercase tracking-wide">Avg score</th>
                <th className="pb-2 text-right text-xs text-gray-400 uppercase tracking-wide">Fail rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {questions.map((q) => (
                <tr key={q.question_id}>
                  <td className="py-2 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                    {q.statement}
                  </td>
                  <td className="py-2 text-sm text-right font-mono text-gray-600 dark:text-gray-400">
                    {q.avg_score.toFixed(1)}
                  </td>
                  <td className={`py-2 text-sm text-right font-medium ${
                    q.fail_rate >= 60
                      ? "text-red-600 dark:text-red-400"
                      : q.fail_rate >= 30
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400"
                  }`}>
                    {q.fail_rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
