import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { clearToken, fetchWithAuth } from "../lib/auth";

export default function ProfileDeleteData() {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const res = await fetchWithAuth("/auth/me", {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.details || "Failed to delete account");
        setIsDeleting(false);
        return;
      }

      clearToken();

      navigate("/login");
    } catch (err) {
      console.error("Delete account failed:", err);
      setError("Something went wrong while deleting your account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 bg-white max-w-[402px] mx-auto w-full">
        <div className="px-4 py-4">
          <button onClick={() => navigate(-1)} className="text-black">
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
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-[73px] pb-[100px] max-w-[402px] mx-auto w-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
            <svg width="48" height="48" viewBox="0 0 33 33" fill="none">
              <path
                d="M7.5694 12.5359C6.84162 12.2236 6.15117 11.8306 5.51102 11.3644V16.5C5.51102 17.2205 6.1614 18.1913 7.98602 19.0891C9.72815 19.9485 12.2279 20.5618 15.1085 20.7144C15.3785 20.7379 15.6287 20.8654 15.8064 21.0698C15.9842 21.2743 16.0756 21.5399 16.0613 21.8105C16.0471 22.081 15.9282 22.3355 15.73 22.5202C15.5317 22.7048 15.2694 22.8052 14.9985 22.8003C11.9158 22.638 9.12177 21.978 7.06202 20.9633C6.5179 20.699 5.99879 20.386 5.51102 20.0283V25.1625C5.51102 25.5502 5.68565 26.0013 6.16552 26.5004C6.64952 27.0036 7.40165 27.5069 8.4109 27.951C10.4266 28.8379 13.2853 29.4126 16.4973 29.4126C17.292 29.4126 18.0634 29.3787 18.8114 29.3109C19.0816 29.2966 19.3469 29.3876 19.5513 29.565C19.7558 29.7423 19.8835 29.992 19.9075 30.2615C19.9316 30.5311 19.8501 30.7995 19.6803 31.0102C19.5105 31.2209 19.2655 31.3575 18.997 31.3912C18.1658 31.464 17.3317 31.5007 16.4973 31.5012C13.0653 31.5012 9.90827 30.8921 7.5694 29.8622C6.40202 29.348 5.3914 28.71 4.65852 27.9469C3.92152 27.1796 3.42102 26.2364 3.42102 25.1625V7.8375C3.42102 6.76225 3.92152 5.82038 4.65852 5.05313C5.3914 4.29 6.40202 3.65063 7.5694 3.13775C9.9069 2.10788 13.0653 1.49738 16.4973 1.49738C19.9293 1.49738 23.0876 2.10788 25.4251 3.13775C26.5939 3.65063 27.6045 4.29 28.336 5.05313C29.0744 5.82038 29.5735 6.76225 29.5735 7.8375C29.5735 8.91275 29.0744 9.85462 28.336 10.6219C27.6045 11.3836 26.5939 12.0244 25.4251 12.5373C23.0876 13.5658 19.9306 14.1763 16.4973 14.1763C13.0653 14.1763 9.90827 13.5658 7.5694 12.5373V12.5359Z"
                fill="black"
              />
              <path
                d="M29.4594 15.2762C29.4934 15.1241 29.4746 14.965 29.4062 14.8249C29.3379 14.6849 29.2239 14.5722 29.0831 14.5054C28.9423 14.4386 28.783 14.4216 28.6313 14.4572C28.4795 14.4929 28.3444 14.579 28.2481 14.7015L20.7708 24.2399C20.6914 24.3414 20.6422 24.4632 20.6287 24.5913C20.6152 24.7195 20.6379 24.8489 20.6944 24.9647C20.7509 25.0805 20.8388 25.1782 20.9481 25.2464C21.0574 25.3147 21.1837 25.3509 21.3126 25.3509H25.8061L24.5067 31.4834C24.4743 31.6363 24.4951 31.7957 24.5655 31.9353C24.6359 32.0748 24.7518 32.1862 24.894 32.2511C25.0362 32.316 25.1963 32.3304 25.3479 32.2921C25.4994 32.2538 25.6334 32.1649 25.7277 32.0402L32.1737 23.5317C32.251 23.4297 32.2983 23.3081 32.3103 23.1806C32.3222 23.0532 32.2983 22.9249 32.2413 22.8103C32.1843 22.6956 32.0964 22.5992 31.9875 22.5319C31.8786 22.4645 31.7531 22.4289 31.6251 22.429H27.8507L29.4594 15.2762Z"
                fill="black"
              />
            </svg>
          </div>

          <h2 className="font-lato font-bold text-xl text-black mb-4">
            Delete App Data
          </h2>
          <p className="font-inter text-sm text-gray-600 leading-relaxed">
            This will permanently delete your account, all your reviews,
            bookmarks, and followers/following relationships. This action cannot
            be undone.
          </p>

          {error && (
            <div className="mt-6 w-full rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-8 pb-8 space-y-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-4 bg-[#FF7B00] rounded-full font-lato font-bold text-white text-base disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={isDeleting}
            className="w-full py-4 bg-black rounded-full font-lato font-bold text-white text-base disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
