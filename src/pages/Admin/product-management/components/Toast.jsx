export default function Toast({ toast }) {
    if (!toast) return null;

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999]">
            <div
                className={`px-5 py-3 rounded-2xl shadow-xl border font-bold text-sm ${toast.type === "error"
                        ? "bg-red-50 border-red-100 text-red-700"
                        : "bg-white border-[#E7DED7] text-[#4A2C2A]"
                    }`}
            >
                {toast.type === "error" ? "⚠ " : "✓ "}
                {toast.message}
            </div>
        </div>
    );
}