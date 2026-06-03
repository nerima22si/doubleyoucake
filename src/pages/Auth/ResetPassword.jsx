import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage({ type: "", text: "" });

            if (form.password.length < 6) {
                throw new Error("Password minimal 6 karakter.");
            }

            if (form.password !== form.confirmPassword) {
                throw new Error("Konfirmasi password tidak sama.");
            }

            const { error } = await supabase.auth.updateUser({
                password: form.password,
            });

            if (error) throw error;

            setMessage({
                type: "success",
                text: "Password berhasil diubah. Silakan login kembali.",
            });

            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate("/login", { replace: true });
            }, 1500);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Gagal reset password.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf7f3] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#f1e7dd] p-6 sm:p-8">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#8A5F41] hover:underline mb-6"
                >
                    <ArrowLeft size={17} />
                    Kembali ke Login
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-[#4A2C2A]">
                        Reset Password
                    </h1>

                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Masukkan password baru untuk akun kamu.
                    </p>
                </div>

                {message.text && (
                    <div
                        className={`text-sm rounded-xl p-3 mb-4 ${message.type === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-14">
                        <Lock size={18} className="text-gray-400" />

                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password baru"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full outline-none text-sm"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-14">
                        <Lock size={18} className="text-gray-400" />

                        <input
                            type={showConfirm ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Konfirmasi password baru"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full outline-none text-sm"
                        />

                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="text-gray-400"
                        >
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-[#8A5F41] hover:bg-[#6f4a31] text-white font-bold transition-all disabled:opacity-60"
                    >
                        {loading ? "Menyimpan..." : "Simpan Password Baru"}
                    </button>
                </form>
            </div>
        </div>
    );
}