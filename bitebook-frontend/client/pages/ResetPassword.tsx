import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config/api";
import {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword,
} from "../lib/passwordPolicy";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!password.trim()) nextErrors.password = "Password is required";
    else if (!isStrongPassword(password))
      nextErrors.password = PASSWORD_POLICY_MESSAGE;

    if (!confirmPassword.trim())
      nextErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      nextErrors.confirmPassword = "Passwords do not match";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.details || "Reset failed" });
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      console.error("Reset error:", error);
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md p-8 rounded-lg border text-center">
          <h1 className="text-2xl font-semibold mb-4">
            Password Reset Successful
          </h1>
          <p className="mb-6">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-lg border">
        <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>

        {errors.submit && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#FF7B00] text-white rounded"
          >
            {loading ? "Saving..." : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
