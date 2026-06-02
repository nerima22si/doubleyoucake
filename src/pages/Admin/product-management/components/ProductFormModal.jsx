import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export default function ProductFormModal({
    open,
    editing,
    categories,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        product_status: "published",
    });

    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (!open) return;

        if (editing) {
            setForm({
                name: editing.name || "",
                description: editing.description || "",
                price: editing.price || "",
                category_id: editing.category_id || "",
                product_status: editing.product_status || "published",
            });

            setPreview(editing.image_url || "");
            setImageFile(null);
        } else {
            setForm({
                name: "",
                description: "",
                price: "",
                category_id: "",
                product_status: "published",
            });

            setPreview("");
            setImageFile(null);
        }
    }, [open, editing]);

    if (!open) return null;

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Product name is required");
            return;
        }

        if (!form.price || Number(form.price) < 0) {
            alert("Price is required");
            return;
        }

        onSubmit(
            {
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: Number(form.price),
                category_id: form.category_id ? Number(form.category_id) : null,
                product_status: form.product_status,
            },
            imageFile,
            editing?.image_url || null
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-[#E7DED7] shadow-2xl overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">
                            {editing ? "Edit Product" : "Add Product"}
                        </h2>
                        <p className="text-sm text-white/70">
                            Product catalog information
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-black text-[#4A2C2A]">
                            Product Image
                        </label>

                        <label className="mt-2 h-44 rounded-[2rem] border-2 border-dashed border-[#E7DED7] bg-[#FAFAFA] flex items-center justify-center cursor-pointer overflow-hidden">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImagePlus size={34} className="mx-auto mb-2" />
                                    <p className="font-bold text-sm">
                                        Upload product image
                                    </p>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleImage}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Product Name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Contoh: Chocolate Cake"
                        />

                        <Input
                            label="Price"
                            type="number"
                            value={form.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            placeholder="Contoh: 50000"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-black text-[#4A2C2A]">
                                Category
                            </label>

                            <select
                                value={form.category_id}
                                onChange={(e) =>
                                    handleChange("category_id", e.target.value)
                                }
                                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
                            >
                                <option value="">No Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-black text-[#4A2C2A]">
                                Product Status
                            </label>

                            <select
                                value={form.product_status}
                                onChange={(e) =>
                                    handleChange("product_status", e.target.value)
                                }
                                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-black text-[#4A2C2A]">
                            Description
                        </label>

                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            rows={4}
                            placeholder="Deskripsi produk..."
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black"
                        >
                            {editing ? "Update Product" : "Save Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div>
            <label className="text-sm font-black text-[#4A2C2A]">
                {label}
            </label>

            <input
                {...props}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
            />
        </div>
    );
}