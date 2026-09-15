import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL } from "../config/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      try {
        if (!token) {
          setError("Missing verification token");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/verify-email?token=${token}`);

        const data = await res.json();

        if (!res.ok) {
          setError(data.details || "Verification link is invalid or expired");

          setLoading(false);
          return;
        }

        setSuccess(true);
        setLoading(false);
      } catch (err) {
        console.error(err);

        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#FF7B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="font-inter text-[14px] text-gray-600">
            Verifying your email...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-[375px] rounded-2xl border border-[#E0E0E0] bg-white p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-[#FF7B00]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="font-inter font-semibold text-[24px] text-black mb-3">
            Email verified
          </h1>

          <p className="font-inter text-[14px] text-gray-600 mb-8">
            Your account has been successfully verified.
            <br />
            You can now log in.
          </p>

          <Link
            to="/login"
            className="w-full h-10 rounded-lg bg-[#FF7B00] hover:bg-[#E56A00] transition-colors font-inter font-medium text-[14px] text-white flex items-center justify-center"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[375px] rounded-2xl border border-[#E0E0E0] bg-white p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="font-inter font-semibold text-[24px] text-black mb-3">
          Verification failed
        </h1>

        <p className="font-inter text-[14px] text-gray-600 mb-2">{error}</p>

        <p className="font-inter text-[13px] text-gray-500 mb-8">
          Your verification link may have expired.
        </p>

        <Link
          to="/signup"
          className="w-full h-10 rounded-lg bg-[#FF7B00] hover:bg-[#E56A00] transition-colors font-inter font-medium text-[14px] text-white flex items-center justify-center"
        >
          Sign up again
        </Link>
      </div>
    </div>
  );
}
