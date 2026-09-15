import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { setAuthMode } from "../lib/auth";
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from "../lib/passwordPolicy";

export default function AdminSignup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!username.trim()) nextErrors.username = "Username is required";
    else if (username.length < 3) nextErrors.username = "Username must be at least 3 characters";

    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!validateEmail(email)) nextErrors.email = "Please enter a valid email";

    if (!password.trim()) nextErrors.password = "Password is required";
    else if (!isStrongPassword(password)) nextErrors.password = PASSWORD_POLICY_MESSAGE;

    if (!confirmPassword.trim()) nextErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    if (!adminKey.trim()) nextErrors.adminKey = "Admin key is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.details || "Signup failed" });
        return;
      }

      localStorage.setItem("token", data.token);
      setAuthMode("user");
      navigate("/profile");
    } catch (error) {
      console.error("Admin signup error:", error);
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-12 text-center">
        <Link to="/" className="font-spartan text-[42px] leading-none select-none inline-block">
          <span className="text-black" style={{ WebkitTextStroke: "1px black" }}>Bite</span>
          <span className="text-[#FF7B00]" style={{ WebkitTextStroke: "1px black" }}>Book</span>
        </Link>
      </div>

      <div className="w-full max-w-[375px]">
        <div className="text-center mb-8">
          <h1 className="font-inter font-semibold text-[18px] text-black mb-2">Create Admin Account</h1>
          <p className="font-inter text-[14px] text-gray-600">Create an admin account to manage restaurants</p>
        </div>

        {errors.submit && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{errors.submit}</div>}

        <form onSubmit={handleSignup} className="space-y-4 mb-6">
          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">Username</label>
            <input type="text" placeholder="Choose your username" value={username} onChange={(e) => { setUsername(e.target.value); setErrors((prev) => ({ ...prev, username: "" })); }} className={`w-full h-10 px-4 border rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:ring-1 transition-colors ${errors.username ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-[#E0E0E0] focus:border-[#FF7B00] focus:ring-[#FF7B00]"}`} />
            {errors.username && <p className="font-inter text-[11px] text-red-600 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }} className={`w-full h-10 px-4 border rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:ring-1 transition-colors ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-[#E0E0E0] focus:border-[#FF7B00] focus:ring-[#FF7B00]"}`} />
            {errors.email && <p className="font-inter text-[11px] text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: "" })); }} className={`w-full h-10 px-4 pr-10 border rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:ring-1 transition-colors ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-[#E0E0E0] focus:border-[#FF7B00] focus:ring-[#FF7B00]"}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.password && <p className="font-inter text-[11px] text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: "" })); }} className={`w-full h-10 px-4 pr-10 border rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:ring-1 transition-colors ${errors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-[#E0E0E0] focus:border-[#FF7B00] focus:ring-[#FF7B00]"}`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Toggle password visibility">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.confirmPassword && <p className="font-inter text-[11px] text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block font-inter text-[12px] font-medium text-gray-700 mb-2">Admin Key</label>
            <input type="password" placeholder="Enter your admin key" value={adminKey} onChange={(e) => { setAdminKey(e.target.value); setErrors((prev) => ({ ...prev, adminKey: "" })); }} className={`w-full h-10 px-4 border rounded-lg bg-white font-inter text-[14px] text-black placeholder-[#828282] outline-none focus:ring-1 transition-colors ${errors.adminKey ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-[#E0E0E0] focus:border-[#FF7B00] focus:ring-[#FF7B00]"}`} />
            {errors.adminKey && <p className="font-inter text-[11px] text-red-600 mt-1">{errors.adminKey}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full h-10 px-4 mt-6 rounded-lg bg-[#FF7B00] hover:bg-[#E56A00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-inter font-medium text-[14px] text-white flex items-center justify-center gap-2">{loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating admin account...</>) : ("Create Admin Account")}</button>
        </form>

        <p className="text-center font-inter text-[13px] text-gray-600 mt-6">Need a normal user account? <Link to="/signup" className="text-[#FF7B00] font-semibold hover:underline">Create one</Link></p>
      </div>
    </div>
  );
}
