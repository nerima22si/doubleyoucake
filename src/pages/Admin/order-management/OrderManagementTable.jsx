import {
    Search,
    Eye,
    CheckCircle2,
    XCircle,
    PackageCheck,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Wifi,
    Store,
} from "lucide-react";

const STATUS_CONFIG = {
    Masuk: { bg: "#FFF7ED", color: "#C2410C" },
    Diproses: { bg: "#EFF6FF", color: "#1D4ED8" },
    Selesai: { bg: "#F0FDF4", color: "#15803D" },
    Dibatalkan: { bg: "#FEF2F2", color: "#B91C1C" },
    "Open Bill": { bg: "#FFF7ED", color: "#C2410C" },
};

const FILTERS = [
    "Semua",
    "Online",
    "Offline",
    "Masuk",
    "Diproses",
    "Selesai",
    "Dibatalkan",
    "Open Bill",
];

export default function OrderManagementTable({
    orders,
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    onDetail,
    onAccept,
    onReject,
    onComplete,
    onChat,
}) {
    return (
        <div className="bg-white border border-[#EBD9C1] rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#EBD9C1] flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-black text-[#4A2C2A]">
                        Daftar Orderan
                    </h2>
                    <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                        Menampilkan order online, offline POS, dan open bill.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex items-center gap-2 bg-[#FFFBF5] border border-[#EBD9C1] rounded-2xl px-4 py-3">
                        <Search size={17} className="text-[#8B5E3C]" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Cari ID / customer / produk..."
                            className="bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {FILTERS.map((item) => (
                            <button
                                key={item}
                                onClick={() => {
                                    setFilter(item);
                                    setPage(1);
                                }}
                                className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${filter === item
                                        ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                                        : "bg-white text-[#4A2C2A] border-[#EBD9C1] hover:bg-[#FDF5E6]"
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#FFFBF5] text-[#6B4E4C]">
                            {[
                                "ID Order",
                                "Source",
                                "Customer",
                                "Produk",
                                "Tanggal",
                                "Total",
                                "Payment",
                                "Status",
                                "Aksi",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="text-left px-5 py-4 font-black whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-5 py-10 text-center font-bold text-slate-400"
                                >
                                    Belum ada order.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => {
                                const isOffline = order.order_source === "offline";
                                const isOpenBill = order.status === "Open Bill";

                                return (
                                    <tr
                                        key={order.id}
                                        className="border-t border-[#F1E4D1] hover:bg-[#FFFBF5]"
                                    >
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => onDetail(order)}
                                                className="font-black text-[#8B5E3C] hover:text-[#4A2C2A] hover:underline transition-all"
                                            >
                                                {order.id}
                                            </button>
                                        </td>

                                        <td className="px-5 py-4">
                                            <SourceBadge source={order.order_source} />
                                        </td>

                                        <td className="px-5 py-4 font-bold text-[#4A2C2A] whitespace-nowrap">
                                            {order.customerName}
                                        </td>

                                        <td className="px-5 py-4 text-[#4A2C2A]">
                                            <div className="font-bold line-clamp-1">
                                                {order.productSummary}
                                            </div>
                                            <p className="text-xs text-slate-400 font-semibold">
                                                {order.itemCount} item
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-500 whitespace-nowrap">
                                            {order.dateFormatted}
                                        </td>

                                        <td className="px-5 py-4 font-black text-[#4A2C2A] whitespace-nowrap">
                                            {order.totalFormatted}
                                        </td>

                                        <td className="px-5 py-4">
                                            <PaymentBadge status={order.payment_status || "pending"} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onDetail(order)}
                                                    className="w-9 h-9 rounded-xl bg-white border border-[#EBD9C1] text-[#4A2C2A] flex items-center justify-center hover:bg-[#FDF5E6]"
                                                    title="Detail"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {!isOffline && (
                                                    <button
                                                        onClick={() => onChat(order)}
                                                        className="w-9 h-9 rounded-xl bg-[#FDF5E6] border border-[#EBD9C1] text-[#8B5E3C] flex items-center justify-center hover:bg-[#4A2C2A] hover:text-white"
                                                        title="Hubungi Chat"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                )}

                                                {order.status === "Masuk" && !isOpenBill && (
                                                    <>
                                                        <button
                                                            onClick={() => onAccept(order)}
                                                            className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100"
                                                            title="Accept"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() => onReject(order)}
                                                            className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center hover:bg-red-100"
                                                            title="Tolak"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                {order.status === "Diproses" && (
                                                    <button
                                                        onClick={() => onComplete(order)}
                                                        className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100"
                                                        title="Selesaikan"
                                                    >
                                                        <PackageCheck size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-5 border-t border-[#EBD9C1] flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                    Halaman {page} dari {totalPages || 1}
                </p>

                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="w-9 h-9 rounded-xl border border-[#EBD9C1] bg-white flex items-center justify-center disabled:opacity-40"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <button
                        disabled={page === totalPages || totalPages === 0}
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        className="w-9 h-9 rounded-xl border border-[#EBD9C1] bg-white flex items-center justify-center disabled:opacity-40"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function SourceBadge({ source }) {
    const isOffline = source === "offline";

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap inline-flex items-center gap-1 ${isOffline
                    ? "bg-purple-50 text-purple-700"
                    : "bg-blue-50 text-blue-700"
                }`}
        >
            {isOffline ? <Store size={13} /> : <Wifi size={13} />}
            {isOffline ? "Offline" : "Online"}
        </span>
    );
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Masuk;

    return (
        <span
            style={{
                background: cfg.bg,
                color: cfg.color,
            }}
            className="px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
        >
            {status || "Masuk"}
        </span>
    );
}

function PaymentBadge({ status }) {
    const config = {
        pending: {
            bg: "#FFF7ED",
            color: "#C2410C",
            label: "Pending",
        },
        paid: {
            bg: "#F0FDF4",
            color: "#15803D",
            label: "Paid",
        },
        failed: {
            bg: "#FEF2F2",
            color: "#B91C1C",
            label: "Failed",
        },
        cancelled: {
            bg: "#FEF2F2",
            color: "#B91C1C",
            label: "Cancelled",
        },
    };

    const cfg = config[status] || config.pending;

    return (
        <span
            style={{
                background: cfg.bg,
                color: cfg.color,
            }}
            className="px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
        >
            {cfg.label}
        </span>
    );
}