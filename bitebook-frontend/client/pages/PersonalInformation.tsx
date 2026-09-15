import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppTopBar from "../components/AppTopBar";
import BottomNav from "../components/BottomNav";
import {
  fetchCurrentUser,
  fetchWithAuth,
  getAuthMode,
  type AuthUser,
} from "../lib/auth";

interface Field {
  label: string;
  value: string;
}

export default function PersonalInformation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    isStudent: false,
    universityEmail: "",
  });

  const isGuest = getAuthMode() !== "user";

  useEffect(() => {
    const load = async () => {
      if (isGuest) {
        setLoading(false);
        return;
      }

      const me = await fetchCurrentUser();
      setUser(me);
      setForm({
        username: me?.username || "",
        email: me?.email || "",
        isStudent: Boolean(me?.isStudent),
        universityEmail: me?.universityEmail || "",
      });
      setLoading(false);
    };

    load();
  }, [isGuest]);

  const fields: Field[] = useMemo(() => {
    const createdDate = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-GB")
      : "Not set";

    return [
      { label: "Name", value: user?.username || "Not set" },
      { label: "Email Address", value: user?.email || "Not set" },
      { label: "Student Account", value: user?.isStudent ? "Yes" : "No" },
      { label: "University Email", value: user?.universityEmail || "Not set" },
      { label: "Password", value: "••••••••••••" },
      { label: "Member Since", value: createdDate },
    ];
  }, [user]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError("");
    setSaveSuccess("");
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      isStudent: Boolean(user?.isStudent),
      universityEmail: user?.universityEmail || "",
    });
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess("");

    if (!form.username.trim()) {
      setSaveError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setSaveError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetchWithAuth("/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          isStudent: form.isStudent,
          universityEmail: form.universityEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data?.details || "Failed to update profile.");
        return;
      }

      setUser(data);
      setSaveSuccess("Profile updated.");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSaveError("Something went wrong while saving your changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppTopBar showBack onBack={() => navigate(-1)} />

      <main className="flex-1 overflow-y-auto pt-[100px] pb-[100px] max-w-[402px] mx-auto w-full">
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3 p-4 border border-black rounded-lg">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path
                d="M7.583 3.5C6.5 3.5 5.462 3.93 4.696 4.696C3.93 5.462 3.5 6.5 3.5 7.583V20.417C3.5 21.5 3.93 22.538 4.696 23.304C5.462 24.07 6.5 24.5 7.583 24.5H17.5C17.81 24.5 18.106 24.377 18.325 24.158C18.544 23.94 18.667 23.643 18.667 23.333C18.667 23.024 18.544 22.727 18.325 22.508C18.106 22.29 17.81 22.167 17.5 22.167H7.583C7.119 22.167 6.674 21.982 6.346 21.654C6.018 21.326 5.833 20.881 5.833 20.417V7.583C5.833 7.119 6.018 6.674 6.346 6.346C6.674 6.018 7.119 5.833 7.583 5.833H17.5C17.81 5.833 18.106 5.71 18.325 5.492C18.544 5.273 18.667 4.976 18.667 4.667C18.667 4.357 18.544 4.061 18.325 3.842C18.106 3.623 17.81 3.5 17.5 3.5H7.583ZM20.658 8.508C20.55 8.397 20.422 8.308 20.28 8.247C20.137 8.186 19.984 8.154 19.829 8.152C19.674 8.151 19.521 8.181 19.377 8.239C19.234 8.298 19.104 8.385 18.994 8.494C18.885 8.604 18.798 8.734 18.739 8.877C18.681 9.021 18.651 9.174 18.652 9.329C18.654 9.484 18.686 9.637 18.747 9.779C18.808 9.922 18.897 10.051 19.009 10.158L21.684 12.833H10.5C10.191 12.833 9.894 12.956 9.675 13.175C9.456 13.394 9.333 13.691 9.333 14C9.333 14.31 9.456 14.606 9.675 14.825C9.894 15.044 10.191 15.167 10.5 15.167H21.684L19.009 17.842C18.796 18.062 18.678 18.357 18.681 18.663C18.684 18.969 18.806 19.261 19.023 19.477C19.239 19.694 19.532 19.816 19.838 19.819C20.143 19.822 20.438 19.704 20.658 19.492L25.325 14.825C25.544 14.606 25.666 14.309 25.666 14C25.666 13.691 25.544 13.394 25.325 13.175L20.658 8.508Z"
                fill="black"
              />
            </svg>
            <span className="font-lato text-base text-black">
              Personal Information
            </span>
          </div>
        </div>

        {loading ? (
          <div className="px-4">
            <p className="font-inter text-sm text-gray-500">
              Loading account details...
            </p>
          </div>
        ) : isGuest ? (
          <div className="px-4">
            <div className="rounded border border-gray-300 bg-gray-50 p-4">
              <h3 className="font-lato font-bold text-black mb-2">
                Unavailable in Guest Mode
              </h3>
              <p className="font-inter text-sm text-gray-600 mb-4">
                Personal information is only available for signed-in accounts.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-[#FF7B00] text-white font-inter font-medium rounded-lg"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-6 mb-8">
            {saveError && (
              <div className="rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-700">
                {saveSuccess}
              </div>
            )}

            {isEditing ? (
              <>
                <div>
                  <p className="font-lato font-bold text-base text-black mb-1">
                    Name
                  </p>
                  <input
                    value={form.username}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 font-lato text-base text-gray-800"
                  />
                </div>

                <div>
                  <p className="font-lato font-bold text-base text-black mb-1">
                    Email Address
                  </p>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 font-lato text-base text-gray-800"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="isStudent"
                    type="checkbox"
                    checked={form.isStudent}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isStudent: e.target.checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="isStudent"
                    className="font-lato text-base text-gray-800"
                  >
                    Student account
                  </label>
                </div>

                {form.isStudent && (
                  <div>
                    <p className="font-lato font-bold text-base text-black mb-1">
                      University Email
                    </p>
                    <input
                      type="email"
                      value={form.universityEmail}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          universityEmail: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 font-lato text-base text-gray-800"
                    />
                  </div>
                )}
              </>
            ) : (
              fields.map((field) => (
                <div key={field.label}>
                  <p className="font-lato font-bold text-base text-black mb-1">
                    {field.label}
                  </p>
                  <p className="font-lato text-base text-gray-800">
                    {field.value}
                  </p>
                </div>
              ))
            )}

            <div className="pt-4">
              {isEditing ? (
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-[#FF7B00] text-white font-lato font-bold rounded-full disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="w-full py-3 bg-black text-white font-lato font-bold rounded-full disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSaveError("");
                    setSaveSuccess("");
                    setIsEditing(true);
                  }}
                  className="w-full py-3 bg-[#FF7B00] text-white font-lato font-bold rounded-full"
                >
                  Edit Information
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
