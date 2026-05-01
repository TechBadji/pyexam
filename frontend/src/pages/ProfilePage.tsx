import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";
import PyExamLogo from "../components/ui/PyExamLogo";
import { useAuthStore, type AuthUser } from "../store/authStore";

// ── UserAvatar ─────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 72 }: { user: AuthUser; size?: number }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className="rounded-full object-cover ring-4 ring-white/30"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const palette = ["bg-indigo-400", "bg-violet-400", "bg-pink-400", "bg-teal-400", "bg-amber-400"];
  const color = palette[user.full_name.charCodeAt(0) % palette.length];
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold select-none ring-4 ring-white/30`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${props.className ?? ""}`}
    />
  );
}

function SaveButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
    >
      {label}
    </button>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </span>
  );
}

// ── Avatar section ────────────────────────────────────────────────────────────

function AvatarSection() {
  const { t } = useTranslation("profile");
  const { user, updateUser } = useAuthStore();
  const [url, setUrl] = useState(user?.avatar_url ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    const trimmed = url.trim();
    if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
      setError("L'URL doit commencer par http:// ou https://");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.put<{ avatar_url: string | null }>("/student/avatar", {
        avatar_url: trimmed || null,
      });
      updateUser({ avatar_url: data.avatar_url });
      setSaved(true);
    } catch {
      setError(t("errors.server_error"));
    } finally {
      setLoading(false);
    }
  };

  const avatarIcon = (
    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <SectionCard title={t("avatar.title")} icon={avatarIcon}>
      <div className="flex items-center gap-5 mb-5">
        <UserAvatar user={{ ...user, avatar_url: url.trim() || null }} size={64} />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("avatar.subtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("avatar.label")}>
          <TextInput
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
            placeholder={t("avatar.placeholder")}
          />
        </Field>
        <div className="flex items-center gap-4 pt-1">
          <SaveButton loading={loading} label={loading ? t("avatar.saving") : t("avatar.save")} />
          {saved && <SuccessBanner message={t("avatar.saved")} />}
          {error && <ErrorBanner message={error} />}
        </div>
      </form>
    </SectionCard>
  );
}

// ── Profile info section ──────────────────────────────────────────────────────

function ProfileInfoSection() {
  const { t } = useTranslation("profile");
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [studentNumber, setStudentNumber] = useState(user?.student_number ?? "");
  const [lang, setLang] = useState<"fr" | "en">(user?.preferred_language ?? "fr");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError("");
    try {
      const { data } = await api.put<AuthUser>("/student/profile", {
        full_name: fullName.trim() || undefined,
        student_number: studentNumber.trim() || undefined,
        preferred_language: lang,
      });
      updateUser(data);
      setSaved(true);
    } catch {
      setError(t("errors.server_error"));
    } finally {
      setLoading(false);
    }
  };

  const infoIcon = (
    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <SectionCard title={t("info.title")} icon={infoIcon}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("info.full_name")}>
          <TextInput
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
            required
          />
        </Field>
        <Field label={t("info.student_number")}>
          <TextInput
            type="text"
            value={studentNumber}
            onChange={(e) => { setStudentNumber(e.target.value); setSaved(false); }}
          />
        </Field>
        <Field label={t("info.preferred_language")}>
          <select
            value={lang}
            onChange={(e) => { setLang(e.target.value as "fr" | "en"); setSaved(false); }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="fr">{t("info.lang_fr")}</option>
            <option value="en">{t("info.lang_en")}</option>
          </select>
        </Field>
        <div className="flex items-center gap-4 pt-1">
          <SaveButton loading={loading} label={loading ? t("info.saving") : t("info.save")} />
          {saved && <SuccessBanner message={t("info.saved")} />}
          {error && <ErrorBanner message={error} />}
        </div>
      </form>
    </SectionCard>
  );
}

// ── Password section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const { t } = useTranslation("profile");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");

    if (next !== confirm) { setError(t("password.mismatch")); return; }
    if (next.length < 6) { setError(t("password.too_short")); return; }

    setLoading(true);
    try {
      await api.put("/student/password", {
        current_password: current,
        new_password: next,
      });
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "";
      if (detail.toLowerCase().includes("incorrect")) {
        setError(t("password.wrong_current"));
      } else {
        setError(t("errors.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const lockIcon = (
    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <SectionCard title={t("password.title")} icon={lockIcon}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("password.current")}>
          <TextInput
            type="password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setSaved(false); setError(""); }}
            required
            autoComplete="current-password"
          />
        </Field>
        <Field label={t("password.new")} hint={t("password.hint")}>
          <TextInput
            type="password"
            value={next}
            onChange={(e) => { setNext(e.target.value); setSaved(false); setError(""); }}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label={t("password.confirm")}>
          <TextInput
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setSaved(false); setError(""); }}
            required
            autoComplete="new-password"
          />
        </Field>
        <div className="flex items-center gap-4 pt-1">
          <SaveButton loading={loading} label={loading ? t("password.saving") : t("password.save")} />
          {saved && <SuccessBanner message={t("password.saved")} />}
          {error && <ErrorBanner message={error} />}
        </div>
      </form>
    </SectionCard>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { t } = useTranslation("profile");
  const { t: tCommon } = useTranslation("common");
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
          <div className="flex items-center gap-2 mb-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {tCommon("nav.dashboard")}
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <PyExamLogo size={44} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{t("title")}</h1>
              <p className="text-sm text-indigo-200 mt-0.5">PyExam · Espace étudiant</p>
            </div>
            {user && <UserAvatar user={user} size={60} />}
          </div>

          {user && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-base font-semibold text-white">{user.full_name}</p>
              <p className="text-sm text-indigo-200 mt-0.5">
                {user.email}
                {user.student_number && <span className="ml-3">· N° {user.student_number}</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-5">
          <AvatarSection />
          <ProfileInfoSection />
          <PasswordSection />
        </div>
      </main>
    </div>
  );
}
