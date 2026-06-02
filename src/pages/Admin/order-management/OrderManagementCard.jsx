import {
    ShoppingBag,
    Clock3,
    Package,
    CheckCircle2,
    XCircle,
    Wallet,
} from "lucide-react";

const CARD_CONFIG = [
    {
        key: "total",
        label: "Total Order",
        sub: "Semua pesanan",
        icon: ShoppingBag,
        color: "#4A2C2A",
    },
    {
        key: "masuk",
        label: "Order Masuk",
        sub: "Menunggu accept",
        icon: Clock3,
        color: "#EA580C",
    },
    {
        key: "diproses",
        label: "Diproses",
        sub: "Sedang dikerjakan",
        icon: Package,
        color: "#2563EB",
    },
    {
        key: "selesai",
        label: "Selesai",
        sub: "Berhasil selesai",
        icon: CheckCircle2,
        color: "#16A34A",
    },
    {
        key: "dibatalkan",
        label: "Dibatalkan",
        sub: "Ditolak/batal",
        icon: XCircle,
        color: "#DC2626",
    },
    {
        key: "revenue",
        label: "Pendapatan",
        sub: "Dari order selesai",
        icon: Wallet,
        color: "#8B5E3C",
        money: true,
    },
];

export default function OrderManagementCard({ stats, formatRupiah }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {CARD_CONFIG.map((item) => {
                const Icon = item.icon;
                const value = item.money
                    ? formatRupiah(stats?.[item.key] || 0)
                    : stats?.[item.key] ?? 0;

                return (
                    <div
                        key={item.key}
                        className="bg-white border border-[#EBD9C1] rounded-[1.5rem] p-5 shadow-sm hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: `${item.color}18`,
                                    color: item.color,
                                }}
                            >
                                <Icon size={22} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-400 truncate">
                                    {item.label}
                                </p>

                                <h3 className={`font-black text-[#4A2C2A] ${item.money ? "text-lg" : "text-2xl"}`}>
                                    {value}
                                </h3>

                                <p className="text-xs font-semibold text-[#6B4E4C] truncate">
                                    {item.sub}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
