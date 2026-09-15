import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { setAuthMode } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.details || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      setAuthMode("user");
      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/guest`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.details || "Failed to continue as guest");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      setAuthMode("guest");
      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error("Guest login error:", err);
      setError("Unable to continue as guest right now.");
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
          <span
            className="text-black"
            style={{ WebkitTextStroke: "1px black" }}
          >
            Bite
          </span>
          <span
            className="text-[#FF7B00]"
            style={{ WebkitTextStroke: "1px black" }}
          >
            Book
          </span>
        </Link>
      </div>

      <div className="w-full max-w-[375px]">
        <div className="text-center mb-8">
          <h1 className="font-inter font-semibold text-[18px] text-black mb-2">
            Welcome Back
          </h1>
          <p className="font-inter text-[14px] text-gray-600">
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-inter text-[13px] text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full h-10 px-4 border border-[#E0E0E0] rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00] transition-colors"
            />
          </div>

          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full h-10 px-4 pr-10 border border-[#E0E0E0] rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="font-inter text-[12px] text-[#FF7B00] font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 px-4 mt-6 rounded-lg bg-[#FF7B00] hover:bg-[#E56A00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-inter font-medium text-[14px] text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E0E0E0]"></div>
          </div>
          <div className="relative flex justify-center text-[12px]">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGuestMode}
          className="w-full h-10 px-4 rounded-lg border-2 border-[#FF7B00] hover:bg-orange-50 transition-colors font-inter font-medium text-[14px] text-[#FF7B00]"
        >
          Continue as Guest
        </button>

        <p className="text-center font-inter text-[13px] text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-[#FF7B00] font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>

      <p className="text-center font-inter text-[11px] text-gray-400 mt-12 max-w-xs">
        Your account is secure. We'll never share your data.
      </p>
    </div>
  );
}
