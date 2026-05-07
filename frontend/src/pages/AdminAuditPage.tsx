import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";

interface LogItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  extra_data: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  EXAM_CREATE:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  CORRECTION_LAUNCH:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  EXAM_START:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ANSWER_SAVE:        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  USER_CREATE:        "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  PASSWORD_RESET:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const KNOWN_ACTIONS = [
  "EXAM_CREATE", "CORRECTION_LAUNCH", "EXAM_START", "ANSWER_SAVE", "USER_CREATE", "PASSWORD_RESET",
];

const PAGE_SIZE = 50;

export default function AdminAuditPage() {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = (off = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(off));
    api.get<{ items: LogItem[]; total: number }>(`/admin/audit-logs?${params}`)
      .then(({ data }) => { setLogs(data.items); setTotal(data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { setOffset(0); load(0); }, [actionFilter]);

  const goPage = (off: number) => { setOffset(off); load(off); };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/admin" className="flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t("report.back")}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{t("audit.title")}</h1>
              <p className="text-sm text-indigo-200 mt-0.5">{total} {t("audit.total_events")}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {/* Filter */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("audit.all_actions")}</option>
            {KNOWN_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[t("audit.col_date"), t("audit.col_action"), t("audit.col_user"), t("audit.col_details")].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.user_name}</p>
                        <p className="text-xs text-gray-400">{log.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {log.extra_data ? (
                          <span className="text-indigo-500 hover:underline">{expanded === log.id ? "▲" : "▼"} {t("audit.show_details")}</span>
                        ) : "—"}
                      </td>
                    </tr>
                    {expanded === log.id && log.extra_data && (
                      <tr key={`${log.id}-detail`} className="bg-gray-50 dark:bg-gray-800/60">
                        <td colSpan={4} className="px-6 py-3">
                          <pre className="text-xs font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">
                            {JSON.stringify(log.extra_data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">{t("audit.empty")}</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} / {total}</span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => goPage(offset - PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ←
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => goPage(offset + PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
