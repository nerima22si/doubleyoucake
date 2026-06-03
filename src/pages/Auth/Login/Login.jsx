import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const redirectByRole = (role) => {
    const cleanRole = String(role || "customer").trim().toLowerCase();

    if (cleanRole === "admin") {
      navigate("/dashboard/admin", { replace: true });
      return;
    }

    if (cleanRole === "cashier") {
      navigate("/dashboard/cashier", { replace: true });
      return;
    }

    navigate("/customer/dashboard", { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) throw error;

      const user = data?.user;

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      redirectByRole(profile?.role);
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message || "Login Google gagal");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f3] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#f1e7dd] p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#4A2C2A]">
            Login
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Masuk ke akun Double You Cake
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-14">
            <Mail size={18} className="text-gray-400" />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-14">
            <Lock size={18} className="text-gray-400" />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full outline-none text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-[#8A5F41] hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-[#8A5F41] hover:bg-[#6f4a31] text-white font-bold transition-all disabled:opacity-60"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-gray-200" />

          <span className="text-xs text-gray-400">
            ATAU
          </span>

          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-14 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="w-5 h-5"
          />

          <span className="font-semibold text-sm">
            Continue with Google
          </span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-7">
          Belum punya akun?{" "}

          <Link to="/register" className="font-bold text-[#8A5F41]">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}