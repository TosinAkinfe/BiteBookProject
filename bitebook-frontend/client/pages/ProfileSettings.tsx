import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import { clearToken, getAuthMode } from "../lib/auth";

function SettingsLink({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex-1">
        <p className="font-lato font-bold text-base text-black">{title}</p>
        {description && (
          <p className="font-inter text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);

  const isGuest = getAuthMode() !== "user";

  const handleLogout = () => {
    clearToken();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    clearToken();
    setShowDeleteAccountConfirm(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar showBack onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pt-[100px] pb-[100px] max-w-[402px] mx-auto w-full px-4">
        <div className="mb-8">
          <h1 className="font-lato font-bold text-2xl text-black">Settings</h1>
          <p className="font-inter text-sm text-gray-500 mt-1">
            Manage your account, app appearance, and privacy information.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="font-lato font-bold text-xs text-gray-500 mb-3 uppercase tracking-widest">
              Account Settings
            </h2>
            <div className="space-y-2">
              {!isGuest && (
                <SettingsLink
                  to="/profile/personal-info"
                  title="Personal Information"
                  description="Update your username, email, and student details."
                />
              )}
              <SettingsLink
                to="/profile/theme"
                title="App Theme"
                description="Switch between light and dark mode."
              />
            </div>
          </section>

          <section>
            <h2 className="font-lato font-bold text-xs text-gray-500 mb-3 uppercase tracking-widest">
              Information
            </h2>
            <div className="space-y-2">
              <SettingsLink to="/profile/terms" title="Terms and Conditions" />
              <SettingsLink to="/profile/privacy" title="Privacy Policy" />
              <SettingsLink to="/profile/cookies" title="Cookies" />
              {!isGuest && (
                <SettingsLink
                  to="/profile/delete-data"
                  title="Delete App Data"
                  description="Remove your reviews and bookmarks from this device/account."
                />
              )}
            </div>
          </section>

          <section className="space-y-3">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <p className="font-lato font-bold text-base text-black">
                {isGuest ? "Exit Guest Mode" : "Log Out"}
              </p>
            </button>

            {!isGuest && (
              <button
                onClick={() => setShowDeleteAccountConfirm(true)}
                className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left transition-colors hover:bg-red-100"
              >
                <p className="font-lato font-bold text-base text-red-500">
                  Delete your account
                </p>
              </button>
            )}
          </section>
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-2 text-center font-lato font-bold text-lg text-black">
              {isGuest ? "Exit Guest Mode?" : "Sign Out?"}
            </h3>
            <p className="mb-6 text-center font-inter text-sm text-gray-600">
              {isGuest
                ? "You will need to sign in again to access saved features."
                : "Are you sure you want to sign out of your account?"}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full rounded-full bg-[#FF7B00] py-3 font-lato font-bold text-base text-white"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-full bg-black py-3 font-lato font-bold text-base text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-2 text-center font-lato font-bold text-lg text-black">
              Delete Account?
            </h3>
            <p className="mb-6 text-center font-inter text-sm text-gray-600">
              Are you sure you want to permanently delete your account? This
              action cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                className="w-full rounded-full bg-[#FF7B00] py-3 font-lato font-bold text-base text-white"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteAccountConfirm(false)}
                className="w-full rounded-full bg-black py-3 font-lato font-bold text-base text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
