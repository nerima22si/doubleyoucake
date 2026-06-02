import {
    Package,
    AlertTriangle,
    Ban,
    Wallet,
} from "lucide-react";

import { formatRupiah } from "../../../../utils/currency";

const STATS = [
    {
        key: "total",
        label: "Total Produk",
        icon: Package,
        accent: "#8A5F41",
        sub: "Semua produk tersedia",
    },
    {
        key: "outOfStock",
        label: "Stok Habis",
        icon: Ban,
        accent: "#EF4444",
        sub: "Perlu restock segera",
    },
    {
        key: "lowStock",
        label: "Stok Menipis",
        icon: AlertTriangle,
        accent: "#F59E0B",
        sub: "Segera tambahkan stok",
    },
    {
        key: "totalValue",
        label: "Total Nilai",
        icon: Wallet,
        accent: "#22C55E",
        sub: "Estimasi nilai inventory",
        format: true,
    },
];

export default function ProductStats({
    stats,
    loading,
}) {
    return (
        <div
            className="pm-stats"
            style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
            }}
        >
            {STATS.map((s) => {
                const Icon = s.icon;

                return (
                    <div
                        key={s.key}
                        style={{
                            backgroundColor: "#fff",
                            border:
                                "0.5px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "20px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flex: 1,
                            minWidth: "220px",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Decorative Accent */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "80px",
                                height: "80px",
                                borderRadius:
                                    "0 16px 0 80px",
                                backgroundColor:
                                    s.accent + "18",
                            }}
                        />

                        {/* Icon */}
                        <div
                            style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "14px",
                                backgroundColor:
                                    s.accent + "20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    "center",
                                flexShrink: 0,
                            }}
                        >
                            <Icon
                                size={22}
                                color={s.accent}
                            />
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#9ca3af",
                                    fontWeight: 400,
                                    marginBottom: 4,
                                }}
                            >
                                {s.label}
                            </div>

                            {loading ? (
                                <div
                                    className="pm-skeleton"
                                    style={{
                                        height: 28,
                                        width: 90,
                                        borderRadius: 8,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        fontSize: s.format
                                            ? "20px"
                                            : "28px",
                                        fontWeight: 700,
                                        color: "#111827",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {s.format
                                        ? formatRupiah(
                                            stats[
                                            s
                                                .key
                                            ]
                                        )
                                        : stats[
                                        s.key
                                        ]}
                                </div>
                            )}

                            <div
                                style={{
                                    marginTop: 4,
                                    fontSize: "12px",
                                    color: "#6b7280",
                                }}
                            >
                                {s.sub}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}