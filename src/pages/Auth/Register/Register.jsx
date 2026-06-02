import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import {
    Mail,
    Lock,
    User,
    Phone,
    MapPin,
} from "lucide-react";

export default function Register() {

    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [form, setForm] = useState({

        first_name: "",
        last_name: "",
        phone: "",
        address: "",
        email: "",
        password: "",

    });

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    /* ─────────────────────────────
       REGISTER
    ───────────────────────────── */

    const handleRegister =
        async (e) => {

            e.preventDefault();

            try {

                setLoading(true);
                setError("");
                setSuccess("");

                const {
                    data,
                    error
                } = await supabase.auth.signUp({

                    email: form.email,
                    password: form.password,

                    options: {

                        data: {

                            first_name:
                                form.first_name,

                            last_name:
                                form.last_name,

                            phone:
                                form.phone,

                            address:
                                form.address,

                            role:
                                "customer",
                        },
                    },
                });

                if (error) throw error;

                setSuccess(
                    "Registrasi berhasil! Cek email untuk verifikasi."
                );

                setTimeout(() => {

                    navigate("/login");

                }, 2000);

            } catch (err) {

                setError(err.message);

            } finally {

                setLoading(false);
            }
        };

    /* ─────────────────────────────
       GOOGLE REGISTER
    ───────────────────────────── */

    const handleGoogleRegister =
        async () => {

            try {

                const { error } =
                    await supabase.auth.signInWithOAuth({

                        provider: "google",

                        options: {

                            redirectTo:
                                window.location.origin +
                                "/auth/callback",
                        },
                    });

                if (error) throw error;

            } catch (err) {

                setError(err.message);
            }
        };

    return (
        <div className="min-h-screen bg-[#faf7f3] flex items-center justify-center px-4 py-10">

            <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-[#f1e7dd] p-8">

                {/* HEADER */}

                <div className="text-center mb-8">

                    <h1 className="text-3xl font-black text-[#4A2C2A]">
                        Register
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                        Buat akun baru
                    </p>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="bg-red-100 text-red-700 text-sm rounded-xl p-3 mb-4">
                        {error}
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div className="bg-green-100 text-green-700 text-sm rounded-xl p-3 mb-4">
                        {success}
                    </div>
                )}

                {/* FORM */}

                <form
                    onSubmit={handleRegister}
                    className="space-y-4"
                >

                    {/* NAMA */}

                    <div className="grid md:grid-cols-2 gap-4">

                        <InputField
                            icon={<User size={18} />}
                            placeholder="Nama depan"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={<User size={18} />}
                            placeholder="Nama belakang"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                        />

                    </div>

                    {/* PHONE */}

                    <InputField
                        icon={<Phone size={18} />}
                        placeholder="Nomor HP"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    {/* ADDRESS */}

                    <InputField
                        icon={<MapPin size={18} />}
                        placeholder="Alamat"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                    />

                    {/* EMAIL */}

                    <InputField
                        icon={<Mail size={18} />}
                        placeholder="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    {/* PASSWORD */}

                    <InputField
                        icon={<Lock size={18} />}
                        placeholder="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                    />

                    {/* BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-xl bg-[#8A5F41] hover:bg-[#6f4a31] text-white font-bold transition-all"
                    >
                        {loading
                            ? "Loading..."
                            : "Register"}
                    </button>

                </form>

                {/* DIVIDER */}

                <div className="flex items-center gap-4 my-6">

                    <div className="flex-1 h-[1px] bg-gray-200" />

                    <span className="text-xs text-gray-400">
                        ATAU
                    </span>

                    <div className="flex-1 h-[1px] bg-gray-200" />

                </div>

                {/* GOOGLE */}

                <button
                    onClick={handleGoogleRegister}
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

                {/* FOOTER */}

                <p className="text-center text-sm text-gray-500 mt-7">

                    Sudah punya akun?{" "}

                    <Link
                        to="/login"
                        className="font-bold text-[#8A5F41]"
                    >
                        Login
                    </Link>

                </p>

            </div>

        </div>
    );
}

/* ─────────────────────────────
   INPUT
───────────────────────────── */

function InputField({
    icon,
    placeholder,
    type = "text",
    name,
    value,
    onChange,
}) {

    return (

        <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 h-14">

            <span className="text-gray-400">
                {icon}
            </span>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full outline-none text-sm"
            />

        </div>
    );
}