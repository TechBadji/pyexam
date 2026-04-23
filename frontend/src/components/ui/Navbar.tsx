import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { t } = useTranslation("common");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400 text-lg"
          >
            <span className="text-2xl">🐍</span>
            PyExam
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              {user.role === "admin" ? (
                <Link
                  to="/admin"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {t("nav.admin")}
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <DarkModeToggle />

            {user && (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {t("buttons.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
