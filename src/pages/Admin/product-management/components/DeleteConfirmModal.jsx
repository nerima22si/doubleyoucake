import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({
    open,
    title,
    desc,
    onCancel,
    onConfirm,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] border border-[#E7DED7] shadow-2xl p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                    <AlertTriangle size={26} />
                </div>

                <h2 className="text-xl font-black text-[#4A2C2A]">
                    {title}
                </h2>

                <p className="text-sm text-gray-500 font-semibold mt-2">
                    {desc}
                </p>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 rounded-2xl bg-red-600 text-white font-black"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}