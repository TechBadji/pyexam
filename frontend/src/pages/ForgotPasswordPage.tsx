import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import PyExamLogo from "../components/ui/PyExamLogo";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error(t("errors.server_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <Link to="/login" className="flex items-center gap-2">
          <PyExamLogo size={36} />
          <span className="font-bold text-gray-900 dark:text-white text-lg">PyExam</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("forgot_password.success_title")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("forgot_password.success_message")}
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← {t("forgot_password.back_to_login")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t("forgot_password.title")}
                </h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {t("forgot_password.subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    {t("forgot_password.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t("forgot_password.loading")}
                    </>
                  ) : (
                    t("forgot_password.submit")
                  )}
                </button>

                <p className="text-center text-sm">
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← {t("forgot_password.back_to_login")}
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
