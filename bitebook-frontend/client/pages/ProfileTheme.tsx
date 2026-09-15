import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getStoredTheme, setTheme, type ThemeMode } from "../lib/theme";

export default function ProfileTheme() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ThemeMode>(getStoredTheme());

  const handleSelect = (mode: ThemeMode) => {
    setSelected(mode);
    setTheme(mode);
  };

  const handleSave = () => {
    setTheme(selected);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white max-w-[402px] mx-auto w-full">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l-6-6 6-6"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12h18"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-lato font-bold text-xl text-black">
              App Theme
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full px-4">
        <div className="mt-8 space-y-4">
          <h2 className="font-lato font-bold text-sm text-gray-500 uppercase tracking-widest mb-6">
            Choose your theme
          </h2>

          {/* Light Mode */}
          <button
            onClick={() => handleSelect("light")}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              selected === "light"
                ? "border-[#FF7B00] bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="#FF7B00" />
                <path
                  d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="#FF7B00"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-lato font-bold text-lg text-black">
                Light Mode
              </p>
              <p className="font-inter text-sm text-gray-500">
                Bright, clean interface
              </p>
            </div>
            {selected === "light" && (
              <div className="w-6 h-6 rounded-full bg-[#FF7B00] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => handleSelect("dark")}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
              selected === "dark"
                ? "border-[#FF7B00] bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-lato font-bold text-lg text-black">
                Dark Mode
              </p>
              <p className="font-inter text-sm text-gray-500">
                Easier on the eyes at night
              </p>
            </div>
            {selected === "dark" && (
              <div className="w-6 h-6 rounded-full bg-[#FF7B00] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#FF7B00] rounded-full font-lato font-bold text-white text-base"
          >
            Save
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
