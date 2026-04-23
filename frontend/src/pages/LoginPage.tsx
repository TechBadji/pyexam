import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import { useAuthStore } from "../store/authStore";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: { id: string; full_name: string; role: "student" | "admin" };
}

export default function LoginPage() {
  const { t, i18n } = useTranslation("auth");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      } else {
        toast.error(t("errors.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🐍</span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">PyExam</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("login.subtitle")}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t("login.title")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("login.email")}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("login.password")}
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-semibold transition-colors mt-2"
            >
              {loading ? "..." : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
