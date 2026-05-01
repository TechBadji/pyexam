import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";

function PyExamLogo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="PyExam logo">
      <rect width="64" height="64" rx="16" fill="#4f46e5" />
      <polygon points="32,11 53,22 32,33 11,22" fill="white" opacity="0.95" />
      <path d="M21 28 L21 39 Q21 43 25 44 L39 44 Q43 44 43 39 L43 28 Z" fill="white" opacity="0.85" />
      <line x1="53" y1="22" x2="53" y2="37" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <circle cx="53" cy="40" r="3" fill="white" opacity="0.9" />
    </svg>
  );
}

type Step = "form" | "verify" | "success";

export default function RegisterPage() {
  const { t, i18n } = useTranslation("auth");
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("register.passwords_mismatch"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("register.password_too_short"));
      return;
    }
    setLoading(true);
    try {
      const lang = i18n.language.startsWith("fr") ? "fr" : "en";
      const { data } = await api.post<{ message: string; dev_code: string | null }>("/auth/register", {
        full_name: fullName,
        email,
        password,
        student_number: studentNumber.trim() || null,
        preferred_language: lang,
      });
      setDevCode(data.dev_code);
      setStep("verify");
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 409) {
        toast.error(t("register.email_taken"));
      } else {
        toast.error(t("errors.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, code });
      setStep("success");
    } catch {
      toast.error(t("register.invalid_code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { data } = await api.post<{ message: string; dev_code: string | null }>(
        "/auth/resend-verification",
        { email }
      );
      setDevCode(data.dev_code);
      toast.success(t("register.code_resent"));
    } catch {
      toast.error(t("errors.server_error"));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <PyExamLogo size={52} />
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">PyExam</span>
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-widest mt-0.5">Exam Platform</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">{t("hero.title")}</h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">{t("hero.subtitle")}</p>
        </div>

        <p className="relative z-10 text-indigo-400 text-xs">© 2025 PyExam · Python Exam Platform</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2 lg:hidden">
            <PyExamLogo size={36} />
            <span className="font-bold text-gray-900 dark:text-white text-lg">PyExam</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">

            {/* ── Step 1 : Registration form ── */}
            {step === "form" && (
              <>
                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("register.title")}</h1>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{t("register.subtitle")}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.full_name")}
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      required
                      autoFocus
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("register.full_name_placeholder")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.email")}
                    </label>
                    <input
                      id="reg_email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.student_number")}
                    </label>
                    <input
                      id="student_number"
                      type="text"
                      autoComplete="off"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder={t("register.student_number_placeholder")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.password")}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">{t("register.password_hint")}</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg_password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t("register.hide_password") : t("register.show_password")}
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

                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.confirm_password")}
                    </label>
                    <input
                      id="confirm_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("register.loading")}
                      </>
                    ) : (
                      t("register.submit")
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("register.have_account")}{" "}
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    {t("register.sign_in")}
                  </Link>
                </p>
              </>
            )}

            {/* ── Step 2 : Verification code ── */}
            {step === "verify" && (
              <>
                <div className="mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-5">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("register.verify_title")}</h1>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {t("register.verify_subtitle")}{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                  </p>
                </div>

                {/* Dev mode banner */}
                {devCode && (
                  <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {t("register.dev_hint")}{" "}
                      <span className="font-bold text-lg tracking-widest">{devCode}</span>
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="verify_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("register.verify_label")}
                    </label>
                    <input
                      id="verify_code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder={t("register.verify_placeholder")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-2xl font-bold tracking-[0.4em] text-center placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t("register.verify_loading")}
                      </>
                    ) : (
                      t("register.verify_submit")
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-4 w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium text-center"
                >
                  {t("register.resend")}
                </button>
              </>
            )}

            {/* ── Step 3 : Success ── */}
            {step === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t("register.success_title")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  {t("register.success_message")}
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {t("register.success_button")}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
