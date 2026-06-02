import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function CategoryFormModal({
    open,
    editing,
    onClose,
    onSubmit,
}) {
    const [name, setName] = useState("");

    useEffect(() => {
        if (!open) return;
        setName(editing?.name || "");
    }, [open, editing]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();

        if (!name.trim()) {
            alert("Category name is required");
            return;
        }

        onSubmit({
            name: name.trim(),
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] border border-[#E7DED7] shadow-2xl overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">
                            {editing ? "Edit Category" : "Add Category"}
                        </h2>
                        <p className="text-sm text-white/70">
                            Product category
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
                            Category Name
                        </label>

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Birthday Cake"
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
                            {editing ? "Update Category" : "Save Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}