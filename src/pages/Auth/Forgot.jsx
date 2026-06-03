import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    const handleResetPassword = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage({ type: "", text: "" });

            const { error } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (error) throw error;

            setMessage({
                type: "success",
                text: "Link reset password berhasil dikirim. Silakan cek email kamu.",
            });

            setEmail("");
        } catch (err) {
            setMessage({
                type: "error",
                text: err.message || "Gagal mengirim link reset password.",
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
                        Lupa Kata Sandi
                    </h1>

                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        Masukkan email akun kamu. Kami akan mengirimkan link untuk reset password.
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
                        <Mail size={18} className="text-gray-400" />

                        <input
                            type="email"
                            placeholder="Masukkan email kamu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full outline-none text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-[#8A5F41] hover:bg-[#6f4a31] text-white font-bold transition-all disabled:opacity-60"
                    >
                        {loading ? "Mengirim..." : "Kirim Link Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}