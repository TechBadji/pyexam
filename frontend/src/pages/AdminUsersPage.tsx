import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "admin";
  student_number: string | null;
  preferred_language: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation("admin");
  const lang = i18n.language.startsWith("fr") ? "fr" : "en";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<"" | "student" | "admin">("");
  const [search, setSearch] = useState("");

  // Modals
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", full_name: "", password: "", role: "student", student_number: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; reason: string }[]; generated_passwords: { email: string; full_name: string; password: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);
    api.get<UserRow[]>(`/admin/users?${params}`)
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<typeof importResult>("/admin/students/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      if (data && data.created > 0) load();
      toast.success(t("users.import_success", { created: data?.created ?? 0, skipped: data?.skipped ?? 0 }));
    } catch {
      toast.error(t("errors.server_error", { ns: "auth" }));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const csv = "full_name,email,student_number,password\nJean Dupont,jean.dupont@email.com,20240001,\nMarie Martin,marie.martin@email.com,,";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "students_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (!resetTarget || !newPassword) return;
    setResetting(true);
    try {
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, { new_password: newPassword });
      setResetDone(true);
    } finally {
      setResetting(false);
    }
  };

  const closeReset = () => { setResetTarget(null); setNewPassword(""); setResetDone(false); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(t("users.delete_success"));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail ?? t("users.delete_error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/admin/users", {
        ...createForm,
        student_number: createForm.student_number || null,
      });
      setShowCreate(false);
      setCreateForm({ email: "", full_name: "", password: "", role: "student", student_number: "" });
      load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCreateError(detail ?? t("users.create_error"));
    } finally {
      setCreating(false);
    }
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US");

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    student: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };

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
            <h1 className="text-xl font-bold text-white">{t("users.title")}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImport(true)}
                disabled={importing}
                className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {importing ? "…" : t("users.import_csv")}
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                + {t("users.create_user")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("users.search_placeholder")}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
              {t("users.search")}
            </button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "" | "student" | "admin")}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("users.all_roles")}</option>
            <option value="student">{t("users.role_student")}</option>
            <option value="admin">{t("users.role_admin")}</option>
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
                  {[t("users.col_name"), t("users.col_email"), t("users.col_number"), t("users.col_role"), t("users.col_created"), t("users.col_actions")].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.student_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {u.role === "admin" ? t("users.role_admin") : t("users.role_student")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setResetTarget(u)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 transition-colors"
                        >
                          {t("users.reset_password")}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t("users.delete_user")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">{t("users.empty")}</div>
            )}
          </div>
        )}
      </main>

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t("users.reset_title")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{resetTarget.full_name} — {resetTarget.email}</p>
            {resetDone ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ {t("users.reset_success")}</p>
            ) : (
              <>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("users.new_password")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={closeReset} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {t("exam_form.cancel")}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting || !newPassword}
                    className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {resetting ? "…" : t("users.reset_confirm")}
                  </button>
                </div>
              </>
            )}
            {resetDone && (
              <div className="flex justify-end">
                <button onClick={closeReset} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {t("exam_form.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t("users.delete_user")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{deleteTarget.full_name} — {deleteTarget.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("users.delete_confirm")}</p>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t("exam_form.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {deleting ? "…" : t("users.delete_user")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t("users.create_title")}</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                required
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder={t("users.col_name")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={createForm.student_number}
                onChange={(e) => setCreateForm({ ...createForm, student_number: e.target.value })}
                placeholder={`${t("users.col_number")} (${t("users.optional")})`}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                required
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder={t("users.new_password")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="student">{t("users.role_student")}</option>
                <option value="admin">{t("users.role_admin")}</option>
              </select>
              {createError && (
                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(null); }} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {t("exam_form.cancel")}
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
                  {creating ? "…" : t("users.create_confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Import CSV modal ─────────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImport}
      />
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("users.import_title")}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("users.import_subtitle")}</p>

            {importResult ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {t("users.import_success", { created: importResult.created, skipped: importResult.skipped })}
                </p>
                {importResult.generated_passwords.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t("users.import_passwords_title")}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("users.import_passwords_hint")}</p>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-500">Email</th>
                            <th className="px-3 py-2 text-left text-gray-500">Password</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.generated_passwords.map((p) => (
                            <tr key={p.email} className="border-t border-gray-100 dark:border-gray-700">
                              <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{p.email}</td>
                              <td className="px-3 py-1.5 font-mono text-gray-900 dark:text-gray-100">{p.password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">{t("users.import_errors_title")}</p>
                    <ul className="text-xs text-red-500 space-y-0.5 max-h-24 overflow-y-auto">
                      {importResult.errors.map((e) => (
                        <li key={e.row}>Ligne {e.row} : {e.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button onClick={() => { setShowImport(false); setImportResult(null); }} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                    OK
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t("users.import_template")}
                </button>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {t("exam_form.cancel")}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {importing ? t("users.import_loading") : t("users.import_confirm")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
