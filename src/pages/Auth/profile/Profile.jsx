import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

import {
    User,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Save,
    Camera,
} from "lucide-react";

const PRIMARY = "#4A2C2A";
const SECONDARY = "#8B5E3C";
const CREAM = "#FFFBF5";
const SOFT = "#FDF5E6";
const BORDER = "#EBD9C1";

function SuccessDialog({ open, onClose, title, message }) {
    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(74,44,42,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backdropFilter: "blur(4px)",
                padding: 16,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 380,
                    background: "#fff",
                    borderRadius: 28,
                    padding: 32,
                    textAlign: "center",
                    border: `1px solid ${BORDER}`,
                    animation: "popup 0.3s ease",
                }}
            >
                <div
                    style={{
                        width: 90,
                        height: 90,
                        borderRadius: "50%",
                        background: SOFT,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            background: PRIMARY,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 30,
                            fontWeight: "bold",
                        }}
                    >
                        ✓
                    </div>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 800, color: PRIMARY }}>
                    {title}
                </h2>

                <p style={{ fontSize: 14, color: "#6B4E4C", lineHeight: 1.6 }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    style={{
                        width: "100%",
                        height: 48,
                        border: "none",
                        borderRadius: 16,
                        background: PRIMARY,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: 10,
                    }}
                >
                    Oke
                </button>
            </div>
        </div>
    );
}

function InputField({ icon, label, name, value, onChange, disabled = false }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: PRIMARY,
                }}
            >
                {label}
            </label>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    height: 52,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 16,
                    padding: "0 16px",
                    background: disabled ? "#F7EFE7" : "#fff",
                }}
            >
                <span style={{ color: SECONDARY, flexShrink: 0 }}>
                    {icon}
                </span>

                <input
                    type="text"
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    disabled={disabled}
                    style={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: 14,
                        color: PRIMARY,
                        fontWeight: 600,
                        minWidth: 0,
                    }}
                />
            </div>
        </div>
    );
}

function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        full_name: "",
        email: "",
        phone: "",
        address: "",
        avatar_url: "",
        role: "",
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const fullName = `${profile.first_name} ${profile.last_name}`.trim();

            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    full_name: fullName,
                    phone: profile.phone,
                    address: profile.address,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (error) throw error;

            setProfile((prev) => ({
                ...prev,
                full_name: fullName,
            }));

            setSuccessOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            const avatarUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: avatarUrl })
                .eq("id", user.id);

            if (updateError) throw updateError;

            setProfile({
                ...profile,
                avatar_url: avatarUrl,
            });

            setSuccessOpen(true);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: CREAM,
                    color: PRIMARY,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                }}
            >
                Loading Profile...
            </div>
        );
    }

    return (
        <>
            <style>{`
                *{
                    font-family:'Poppins',sans-serif;
                    box-sizing:border-box;
                }

                @keyframes popup{
                    from{ opacity:0; transform:scale(0.9); }
                    to{ opacity:1; transform:scale(1); }
                }

                .profile-grid{
                    display:grid;
                    grid-template-columns:320px 1fr;
                    gap:24px;
                }

                .input-grid{
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:18px;
                }

                .save-btn:hover{
                    background: linear-gradient(90deg, #4A2C2A, #8B5E3C, #C08B5C) !important;
                    transform: translateY(-1px) scale(1.02);
                    box-shadow: 0 18px 35px rgba(74,44,42,.28);
                }

                .camera-btn:hover{
                    background: linear-gradient(135deg, #4A2C2A, #8B5E3C, #C08B5C) !important;
                    transform: scale(1.08);
                }

                @media(max-width:768px){
                    .profile-grid{
                        grid-template-columns:1fr;
                    }

                    .input-grid{
                        grid-template-columns:1fr;
                    }
                }
            `}</style>

            <div
                style={{
                    minHeight: "100vh",
                    background: CREAM,
                    padding: 40,
                    color: PRIMARY,
                }}
            >
                <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                    <div style={{ marginBottom: 30 }}>
                        <p
                            style={{
                                fontSize: 13,
                                fontWeight: 900,
                                color: SECONDARY,
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                margin: 0,
                            }}
                        >
                            Doubleyou.Cake
                        </p>

                        <h1
                            style={{
                                fontSize: 40,
                                fontWeight: 900,
                                color: PRIMARY,
                                margin: "8px 0 0",
                            }}
                        >
                            My Profile
                        </h1>

                        <p
                            style={{
                                color: "#6B4E4C",
                                marginTop: 8,
                                fontWeight: 600,
                            }}
                        >
                            Kelola informasi akun Anda dengan mudah.
                        </p>
                    </div>

                    {error && (
                        <div
                            style={{
                                background: "#FEF2F2",
                                color: "#DC2626",
                                padding: 14,
                                borderRadius: 14,
                                marginBottom: 20,
                                border: "1px solid #FECACA",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div className="profile-grid">
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: 30,
                                padding: 30,
                                border: `1px solid ${BORDER}`,
                                height: "fit-content",
                                boxShadow: "0 18px 45px rgba(74,44,42,0.08)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: "50%",
                                        background: SOFT,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 18,
                                        position: "relative",
                                        overflow: "hidden",
                                        border: `4px solid ${BORDER}`,
                                    }}
                                >
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="avatar"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <User size={60} color={SECONDARY} />
                                    )}

                                    <label
                                        className="camera-btn"
                                        style={{
                                            position: "absolute",
                                            bottom: 4,
                                            right: 4,
                                            width: 42,
                                            height: 42,
                                            borderRadius: "50%",
                                            background: PRIMARY,
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            border: "3px solid #fff",
                                            transition: "all .3s ease",
                                        }}
                                    >
                                        <Camera size={18} />

                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleUpload}
                                        />
                                    </label>
                                </div>

                                <h2
                                    style={{
                                        fontSize: 24,
                                        fontWeight: 900,
                                        color: PRIMARY,
                                        marginBottom: 6,
                                        textAlign: "center",
                                    }}
                                >
                                    {profile.full_name || "No Name"}
                                </h2>

                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "#6B4E4C",
                                        marginBottom: 14,
                                        textAlign: "center",
                                        fontWeight: 600,
                                    }}
                                >
                                    {profile.email}
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        background: SOFT,
                                        color: SECONDARY,
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        border: `1px solid ${BORDER}`,
                                    }}
                                >
                                    <ShieldCheck size={16} />
                                    {profile.role || "Customer"}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                background: "#fff",
                                borderRadius: 30,
                                padding: 32,
                                border: `1px solid ${BORDER}`,
                                boxShadow: "0 18px 45px rgba(74,44,42,0.08)",
                            }}
                        >
                            <div className="input-grid">
                                <InputField
                                    icon={<User size={18} />}
                                    label="First Name"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={handleChange}
                                />

                                <InputField
                                    icon={<User size={18} />}
                                    label="Last Name"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={handleChange}
                                />

                                <InputField
                                    icon={<Mail size={18} />}
                                    label="Email"
                                    value={profile.email}
                                    disabled
                                />

                                <InputField
                                    icon={<Phone size={18} />}
                                    label="Phone"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div style={{ marginTop: 18 }}>
                                <InputField
                                    icon={<MapPin size={18} />}
                                    label="Address"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div
                                style={{
                                    marginTop: 30,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    className="save-btn"
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        height: 52,
                                        padding: "0 26px",
                                        border: "none",
                                        borderRadius: 16,
                                        background: PRIMARY,
                                        color: "#fff",
                                        fontWeight: 800,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        cursor: "pointer",
                                        transition: "all .3s ease",
                                        boxShadow: "0 12px 25px rgba(74,44,42,.18)",
                                    }}
                                >
                                    <Save size={18} />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SuccessDialog
                open={successOpen}
                onClose={() => setSuccessOpen(false)}
                title="Success!"
                message="Profile berhasil diperbarui."
            />
        </>
    );
}

export default Profile;