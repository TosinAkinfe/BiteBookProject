import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const LANGUAGES = [
  "English",
  "Albanian",
  "Arabic",
  "Armenian",
  "Azerbaijani",
  "Belarusan",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Cantonese",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "Estonian",
  "Finnish",
  "French",
  "Georgian",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Italian",
  "Japanese",
  "Kazakh",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Malay",
  "Maltese",
  "Mandarin",
  "Norwegian",
  "Persian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Russian",
  "Serbian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swedish",
  "Tamil",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
  "Welsh",
];

export default function ProfileLanguage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("English");

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
              Language
            </span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelected(lang)}
            className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selected === lang ? "bg-[#FF7B00]" : "bg-gray-200"}`}
            >
              <svg width="18" height="18" viewBox="0 0 33 33" fill="none">
                <path
                  d="M33 16.4999V16.4916C33 11.609 30.8743 7.22412 27.4986 4.20875L27.4821 4.195C27.4404 4.15009 27.3938 4.10997 27.3433 4.07537L27.3405 4.074C24.3423 1.44193 20.4869 -0.00614633 16.4973 0.00124889C12.3283 0.00124889 8.52225 1.5495 5.621 4.10425L5.63888 4.08912C5.60402 4.11578 5.57179 4.1457 5.54263 4.1785C3.79855 5.72294 2.40251 7.62169 1.44698 9.74633C0.49145 11.871 -0.00176465 14.1744 4.74394e-06 16.504C4.74394e-06 21.3853 2.123 25.7701 5.49588 28.7869L5.51238 28.8006C5.55626 28.85 5.6051 28.8947 5.65813 28.934L5.66088 28.9354C8.65816 31.5639 12.5107 33.0099 16.4973 33.0026C20.5024 33.0088 24.3715 31.5494 27.3749 28.8996L27.357 28.9147C29.1314 27.3721 30.5537 25.4663 31.5277 23.3263C32.5018 21.1863 33.0048 18.8621 33.0028 16.5109V16.5012L33 16.4999ZM17.2865 25.1624C19.0506 25.2572 20.6993 25.645 22.22 26.2761L22.121 26.2404C20.9028 29.0179 19.1881 30.9264 17.2865 31.3457V25.1624ZM17.2865 23.5894V17.2864H23.98C23.9268 19.8965 23.4742 22.483 22.638 24.9561L22.6916 24.776C20.9848 24.0734 19.169 23.6723 17.325 23.5907L17.2879 23.5894H17.2865ZM17.2865 15.7134V9.41037C19.1801 9.32423 21.0444 8.90969 22.7961 8.18525L22.6875 8.22512C23.4506 10.4512 23.9195 13.017 23.98 15.6845V15.7134H17.2865ZM17.2865 7.83737V1.65675C19.1881 2.07612 20.9028 3.97637 22.121 6.76212C20.6993 7.35337 19.0506 7.73975 17.3264 7.836L17.2865 7.83737ZM15.7135 1.66087V7.83737C14.0147 7.75096 12.346 7.37425 10.7773 6.72362L10.8763 6.75937C12.1 3.98187 13.8119 2.07475 15.7135 1.65537L15.7108 1.66087ZM15.7135 9.409V15.712H9.02C9.0805 13.0156 9.54938 10.4499 10.3661 8.04362L10.3125 8.22375C12.0194 8.92296 13.8338 9.32342 15.6764 9.40762L15.7135 9.409ZM15.7135 17.285V23.588C13.8199 23.6741 11.9556 24.0887 10.2039 24.8131L10.3125 24.7732C9.54938 22.5485 9.0805 19.9814 9.02 17.3139V17.285H15.7135ZM15.7135 25.161V31.3416C13.8119 30.9222 12.0973 29.022 10.879 26.2362C12.3008 25.645 13.9494 25.26 15.6736 25.1637L15.7135 25.161Z"
                  fill={selected === lang ? "white" : "black"}
                />
              </svg>
            </div>
            <span className="font-lato font-bold text-xl text-black flex-1 text-left">
              {lang}
            </span>
          </button>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
