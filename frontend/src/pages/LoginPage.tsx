import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import PyExamLogo from "../components/ui/PyExamLogo";
import { useAuthStore } from "../store/authStore";

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-indigo-200"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      className="w-4 h-4 text-indigo-200"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      className="w-4 h-4 text-indigo-200"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function FeatureRow({ icon, text }: { icon: JSX.Element; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm text-indigo-100">{text}</span>
    </div>
  );
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: import("../store/authStore").AuthUser;
}

export default function LoginPage() {
  const { t, i18n } = useTranslation("auth");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const lang = i18n.language.startsWith("fr") ? "fr" : "en";
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
        preferred_language: lang,
      });
      login(data.user, data.access_token, data.refresh_token);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 401) {
        toast.error(t("errors.invalid_credentials"));
      } else if (status === 403) {
        toast.error(t("errors.email_not_verified"));
      } else {
        toast.error(t("errors.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex-col justify-between p-14 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <PyExamLogo size={52} />
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">PyExam</span>
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-widest mt-0.5">
              Exam Platform
            </p>
          </div>
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t("hero.title")}
            </h2>
            <p className="mt-4 text-indigo-200 text-base leading-relaxed max-w-sm">
              {t("hero.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <FeatureRow icon={<CheckIcon />} text={t("hero.feature_1")} />
            <FeatureRow icon={<CodeIcon />} text={t("hero.feature_2")} />
            <FeatureRow icon={<ChartIcon />} text={t("hero.feature_3")} />
          </div>
        </div>

        <p className="relative z-10 text-indigo-400 text-xs">
          © 2025 PyExam · Python Exam Platform
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <PyExamLogo size={36} />
            <span className="font-bold text-gray-900 dark:text-white text-lg">PyExam</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("login.title")}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {t("login.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t("login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  {t("login.password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t("login.no_account")}{" "}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  {t("login.sign_up")}
                </Link>
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {t("login.loading")}
                  </>
                ) : (
                  t("login.submit")
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
