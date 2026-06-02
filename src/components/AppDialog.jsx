import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export default function AppDialog({
    open,
    type = "info",
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    showCancel = false,
}) {
    if (!open) return null;

    const iconConfig = {
        success: <CheckCircle2 size={32} className="text-green-600" />,
        error: <AlertTriangle size={32} className="text-red-600" />,
        warning: <AlertTriangle size={32} className="text-orange-600" />,
        info: <Info size={32} className="text-[#8A5F41]" />,
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-xl">
                <div className="p-6">
                    <div className="flex justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#F6F1EC] flex items-center justify-center">
                                {iconConfig[type]}
                            </div>

                            <div>
                                <h2 className="text-xl font-black text-[#4A2C2A]">
                                    {title}
                                </h2>
                                <p className="text-sm text-gray-500 font-semibold mt-2">
                                    {message}
                                </p>
                            </div>
                        </div>

                        <button onClick={onCancel || onConfirm}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        {showCancel && (
                            <button
                                onClick={onCancel}
                                className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                            >
                                {cancelText}
                            </button>
                        )}

                        <button
                            onClick={onConfirm}
                            className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}