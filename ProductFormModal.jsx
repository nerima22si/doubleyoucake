import { useEffect, useRef, useState } from "react";
import {
    UploadCloud,
    Package2,
    X,
} from "lucide-react";

const EMPTY = {
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
};

const PRIMARY = "#8A5F41";

export default function ProductFormModal({
    open,
    onClose,
    onSubmit,
    editing,
    categories,
}) {
    const [form, setForm] = useState(EMPTY);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const fileRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        if (editing) {
            setForm({
                name: editing.name || "",
                description: editing.description || "",
                price: editing.price ?? "",
                stock: editing.stock ?? "",
                category_id: editing.category_id || "",
            });

            setPreview(editing.image_url || null);
        } else {
            setForm(EMPTY);
            setPreview(null);
        }

        setImageFile(null);
        setErrors({});
    }, [open, editing]);

    function validate() {
        const e = {};

        if (!form.name.trim()) {
            e.name = "Nama wajib diisi";
        }

        if (
            !form.price ||
            isNaN(Number(form.price)) ||
            Number(form.price) < 0
        ) {
            e.price = "Harga tidak valid";
        }

        if (
            form.stock !== "" &&
            (isNaN(Number(form.stock)) || Number(form.stock) < 0)
        ) {
            e.stock = "Stok tidak valid";
        }

        setErrors(e);

        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: Number(form.price),
                stock: form.stock !== "" ? Number(form.stock) : 0,
                category_id: form.category_id
                    ? Number(form.category_id)
                    : null,
            };

            await onSubmit(
                payload,
                imageFile,
                editing?.image_url
            );

            onClose();
        } catch (e) {
            setErrors({
                submit: e.message,
            });
        } finally {
            setSaving(false);
        }
    }

    function handleImageChange(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            setErrors({
                ...errors,
                image: "Maksimal ukuran gambar 3MB",
            });

            return;
        }

        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    }

    const set =
        (k) =>
            (e) => {
                setForm({
                    ...form,
                    [k]: e.target.value,
                });

                setErrors({
                    ...errors,
                    [k]: undefined,
                });
            };

    if (!open) return null;

    return (
        <div
            className="pm-modal-overlay"
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 999,
                padding: 20,
                backdropFilter: "blur(4px)",
                overflowY: "auto",
            }}
        >
            {/* HIDE SCROLLBAR */}
            <style>
                {`
                    .pm-modal::-webkit-scrollbar{
                        display:none;
                    }
                `}
            </style>

            <div
                className="pm-modal"
                style={{
                    width: "100%",
                    maxWidth: 640,
                    background: "#fff",
                    borderRadius: 24,
                    border: "1px solid #eee",
                    boxShadow:
                        "0 25px 50px rgba(0,0,0,0.12)",

                    maxHeight: "90vh",
                    overflowY: "auto",

                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {/* HEADER */}
                <div
                    className="pm-modal-header"
                    style={{
                        padding: "22px 26px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: "#F6F1ED",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: PRIMARY,
                            }}
                        >
                            <Package2 size={22} />
                        </div>

                        <div>
                            <h3
                                className="pm-modal-title"
                                style={{
                                    margin: 0,
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                {editing
                                    ? "Edit Produk"
                                    : "Tambah Produk"}
                            </h3>

                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: 13,
                                    color: "#9ca3af",
                                }}
                            >
                                Lengkapi informasi produk
                            </p>
                        </div>
                    </div>

                    <button
                        className="pm-modal-close"
                        onClick={onClose}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6b7280",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div
                    className="pm-modal-body"
                    style={{
                        padding: 26,
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    {errors.submit && (
                        <div
                            style={{
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                color: "#B91C1C",
                                padding: "12px 14px",
                                borderRadius: 12,
                                fontSize: 13,
                            }}
                        >
                            {errors.submit}
                        </div>
                    )}

                    {/* IMAGE */}
                    <div className="pm-field">
                        <label
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#374151",
                                marginBottom: 10,
                                display: "block",
                            }}
                        >
                            Foto Produk
                        </label>

                        <div
                            onClick={() =>
                                fileRef.current?.click()
                            }
                            style={{
                                border: "2px dashed #d6d3d1",
                                background: "#fafaf9",
                                borderRadius: 18,
                                minHeight: 220,
                                cursor: "pointer",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "0.2s",
                            }}
                        >
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="preview"
                                    style={{
                                        width: "100%",
                                        height: 220,
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: 20,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 20,
                                            background: "#F6F1ED",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin:
                                                "0 auto 16px",
                                            color: PRIMARY,
                                        }}
                                    >
                                        <UploadCloud size={34} />
                                    </div>

                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 15,
                                            color: "#111827",
                                        }}
                                    >
                                        Upload gambar produk
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#9ca3af",
                                            marginTop: 6,
                                        }}
                                    >
                                        JPG, PNG, WEBP •
                                        Maksimal 3MB
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />

                        {errors.image && (
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "#DC2626",
                                    marginTop: 6,
                                    display: "block",
                                }}
                            >
                                {errors.image}
                            </span>
                        )}
                    </div>

                    {/* NAME */}
                    <div className="pm-field">
                        <label style={labelStyle}>
                            Nama Produk *
                        </label>

                        <input
                            value={form.name}
                            onChange={set("name")}
                            placeholder="Masukkan nama produk"
                            style={inputStyle}
                        />

                        {errors.name && (
                            <span style={errorStyle}>
                                {errors.name}
                            </span>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div className="pm-field">
                        <label style={labelStyle}>
                            Deskripsi
                        </label>

                        <textarea
                            value={form.description}
                            onChange={set("description")}
                            placeholder="Tulis deskripsi produk..."
                            rows={4}
                            style={{
                                ...inputStyle,
                                resize: "none",
                                minHeight: 120,
                                paddingTop: 14,
                            }}
                        />
                    </div>

                    {/* PRICE + STOCK */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit,minmax(200px,1fr))",
                            gap: 16,
                        }}
                    >
                        <div>
                            <label style={labelStyle}>
                                Harga *
                            </label>

                            <input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={set("price")}
                                placeholder="50000"
                                style={inputStyle}
                            />

                            {errors.price && (
                                <span style={errorStyle}>
                                    {errors.price}
                                </span>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>
                                Stok
                            </label>

                            <input
                                type="number"
                                min={0}
                                value={form.stock}
                                onChange={set("stock")}
                                placeholder="0"
                                style={inputStyle}
                            />

                            {errors.stock && (
                                <span style={errorStyle}>
                                    {errors.stock}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <label style={labelStyle}>
                            Kategori
                        </label>

                        <select
                            value={form.category_id}
                            onChange={set("category_id")}
                            style={{
                                ...inputStyle,
                                cursor: "pointer",
                            }}
                        >
                            <option value="">
                                — Pilih Kategori —
                            </option>

                            {categories.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                >
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    className="pm-modal-footer"
                    style={{
                        padding: "20px 26px",
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 12,
                        position: "sticky",
                        bottom: 0,
                        background: "#fff",
                    }}
                >
                    <button
                        onClick={onClose}
                        disabled={saving}
                        style={{
                            height: 44,
                            padding: "0 18px",
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Batal
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{
                            height: 44,
                            padding: "0 20px",
                            borderRadius: 12,
                            border: "none",
                            background: PRIMARY,
                            color: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow:
                                "0 10px 25px rgba(138,95,65,0.25)",
                        }}
                    >
                        {saving
                            ? "Menyimpan..."
                            : editing
                                ? "Simpan Perubahan"
                                : "Tambah Produk"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
};

const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8,
    display: "block",
};

const errorStyle = {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 6,
    display: "block",
};