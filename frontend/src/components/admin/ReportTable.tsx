import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";

interface ReportRow {
  student_id: string;
  student_name: string;
  student_number: string | null;
  email: string;
  submission_id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  tab_switch_count: number;
}

interface ReportTableProps {
  rows: ReportRow[];
  examId: string;
}

export default function ReportTable({ rows, examId }: ReportTableProps) {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";

  const fmtScore = (v: number | null) => {
    if (v === null) return "—";
    return lang === "fr" ? v.toFixed(1).replace(".", ",") : v.toFixed(1);
  };

  const fmtDate = (s: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return lang === "fr"
      ? d.toLocaleString("fr-FR")
      : d.toLocaleString("en-US");
  };

  const exportCSV = () => {
    const headers = [
      t("report.student_number"),
      t("report.student_name"),
      "Email",
      t("report.score"),
      t("report.status"),
      t("report.tab_switches"),
      "Submitted At",
    ];
    const lines = rows.map((r) =>
      [
        r.student_number ?? "",
        r.student_name,
        r.email,
        r.total_score ?? "",
        r.status,
        r.tab_switch_count,
        r.submitted_at ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${examId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text(t("report.title"), 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Exam ID: ${examId}  —  ${new Date().toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}`, 14, 22);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 28,
      head: [[
        t("report.student_number"),
        t("report.student_name"),
        "Email",
        t("report.score"),
        t("report.status"),
        t("report.tab_switches"),
        "Submitted At",
      ]],
      body: rows.map((r) => [
        r.student_number ?? "—",
        r.student_name,
        r.email,
        fmtScore(r.total_score),
        r.status,
        r.tab_switch_count,
        fmtDate(r.submitted_at),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });

    doc.save(`report_${examId}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-end">
        <button
          onClick={exportCSV}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ⬇ {t("report.export_csv")}
        </button>
        <button
          onClick={exportPDF}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          ⬇ {t("report.export_pdf")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[
                t("report.student_number"),
                t("report.student_name"),
                t("report.score"),
                t("report.status"),
                t("report.tab_switches"),
                "Submitted At",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {rows.map((row) => (
              <tr key={row.submission_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {row.student_number ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.student_name}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
                  {fmtScore(row.total_score)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.status === "corrected"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      : row.status === "submitted"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm text-center font-medium ${
                  row.tab_switch_count > 3
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {row.tab_switch_count}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {fmtDate(row.submitted_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
            Aucune soumission.
          </div>
        )}
      </div>
    </div>
  );
}
