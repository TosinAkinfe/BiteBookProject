import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.details || "Unable to send reset email.");
        return;
      }

      setMessage(data?.message || "If that account exists, a reset email has been sent.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-12 text-center">
        <Link
          to="/"
          className="font-spartan text-[42px] leading-none select-none inline-block"
        >
          <span className="text-black" style={{ WebkitTextStroke: "1px black" }}>
            Bite
          </span>
          <span className="text-[#FF7B00]" style={{ WebkitTextStroke: "1px black" }}>
            Book
          </span>
        </Link>
      </div>

      <div className="w-full max-w-[375px]">
        <div className="text-center mb-8">
          <h1 className="font-inter font-semibold text-[22px] text-black mb-2">
            Forgot Password
          </h1>
          <p className="font-inter text-[14px] text-gray-600">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-4 border border-[#E0E0E0] rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-[#FF7B00] hover:bg-[#E56A00] disabled:opacity-60 text-white font-inter font-medium text-[14px]"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center font-inter text-[13px] text-gray-600 mt-6">
          Back to {" "}
          <Link to="/login" className="text-[#FF7B00] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
