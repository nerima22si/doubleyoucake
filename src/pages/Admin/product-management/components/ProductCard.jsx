import {
    Pencil,
    Trash2,
    Package,
} from "lucide-react";

import { formatRupiah } from "../../../../utils/currency";
import { stockStatus } from "../../../../utils/helpers";
import EmptyState from "./EmptyState";

export default function ProductCard({
    products,
    loading,
    onEdit,
    onDelete,
}) {
    if (loading)
        return (
            <div className="pm-grid">
                {Array.from({ length: 8 }).map(
                    (_, i) => (
                        <CardSkeleton
                            key={i}
                        />
                    )
                )}
            </div>
        );

    if (!products.length)
        return (
            <EmptyState
                icon={
                    <Package
                        size={28}
                        strokeWidth={1.8}
                    />
                }
                title="Belum ada produk"
                desc="Tambah produk pertama Anda"
            />
        );

    return (
        <div
            className="pm-grid"
            style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fill,minmax(260px,1fr))",
                gap: 18,
            }}
        >
            {products.map((p) => {
                const s = stockStatus(
                    p.stock ?? 0
                );

                return (
                    <div
                        key={p.id}
                        className="pm-product-card"
                        style={{
                            background: "#fff",
                            border:
                                "0.5px solid #e5e7eb",
                            borderRadius: 18,
                            overflow: "hidden",
                            transition:
                                "all .2s ease",
                            position:
                                "relative",
                        }}
                    >
                        {/* IMAGE */}
                        <div
                            className="pm-product-card-img"
                            style={{
                                height: 190,
                                background:
                                    "#f9fafb",
                                position:
                                    "relative",
                                overflow:
                                    "hidden",
                            }}
                        >
                            {p.image_url ? (
                                <img
                                    src={
                                        p.image_url
                                    }
                                    alt={p.name}
                                    style={{
                                        width:
                                            "100%",
                                        height:
                                            "100%",
                                        objectFit:
                                            "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width:
                                            "100%",
                                        height:
                                            "100%",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        color:
                                            "#d1d5db",
                                    }}
                                >
                                    <Package
                                        size={
                                            42
                                        }
                                        strokeWidth={
                                            1.5
                                        }
                                    />
                                </div>
                            )}

                            {/* CATEGORY */}
                            {p.categories
                                ?.name && (
                                <div
                                    style={{
                                        position:
                                            "absolute",
                                        top: 12,
                                        left: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            background:
                                                "rgba(255,255,255,.9)",
                                            backdropFilter:
                                                "blur(8px)",
                                            border:
                                                "0.5px solid #e5e7eb",
                                            color:
                                                "#374151",
                                            fontSize: 11,
                                            fontWeight: 500,
                                            padding:
                                                "6px 10px",
                                            borderRadius: 999,
                                        }}
                                    >
                                        {
                                            p
                                                .categories
                                                .name
                                        }
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* BODY */}
                        <div
                            className="pm-product-card-body"
                            style={{
                                padding: 16,
                            }}
                        >
                            {/* NAME */}
                            <p
                                className="pm-product-card-name"
                                style={{
                                    margin: 0,
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#111827",
                                    lineHeight: 1.5,
                                    marginBottom: 14,
                                    minHeight: 44,
                                }}
                            >
                                {p.name}
                            </p>

                            {/* PRICE + STOCK */}
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                <span
                                    className="pm-product-card-price"
                                    style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: "#EA580C",
                                    }}
                                >
                                    {formatRupiah(
                                        p.price
                                    )}
                                </span>

                                <span
                                    style={{
                                        background:
                                            s.bg,
                                        color:
                                            s.color,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding:
                                            "6px 10px",
                                        borderRadius: 999,
                                        whiteSpace:
                                            "nowrap",
                                    }}
                                >
                                    {p.stock ??
                                        0}{" "}
                                    stok
                                </span>
                            </div>

                            {/* ACTIONS */}
                            <div
                                className="pm-product-card-actions"
                                style={{
                                    display:
                                        "flex",
                                    gap: 10,
                                }}
                            >
                                <button
                                    onClick={() =>
                                        onEdit(
                                            p
                                        )
                                    }
                                    style={{
                                        flex: 1,
                                        height: 40,
                                        border:
                                            "0.5px solid #e5e7eb",
                                        background:
                                            "#fff",
                                        borderRadius: 12,
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        gap: 8,
                                        cursor:
                                            "pointer",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color:
                                            "#374151",
                                    }}
                                >
                                    <Pencil
                                        size={
                                            15
                                        }
                                    />
                                    Edit
                                </button>

                                <button
                                    onClick={() =>
                                        onDelete(
                                            p
                                        )
                                    }
                                    style={{
                                        width: 40,
                                        height: 40,
                                        border:
                                            "none",
                                        background:
                                            "#FEF2F2",
                                        color:
                                            "#DC2626",
                                        borderRadius: 12,
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    <Trash2
                                        size={
                                            15
                                        }
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CardSkeleton() {
    return (
        <div
            className="pm-product-card"
            style={{
                background: "#fff",
                border:
                    "0.5px solid #e5e7eb",
                borderRadius: 18,
                overflow: "hidden",
            }}
        >
            <div
                className="pm-skeleton"
                style={{
                    height: 190,
                    background:
                        "#f3f4f6",
                }}
            />

            <div
                style={{
                    padding: 16,
                    display: "flex",
                    flexDirection:
                        "column",
                    gap: 10,
                }}
            >
                <div
                    className="pm-skeleton"
                    style={{
                        height: 12,
                        width: "40%",
                        borderRadius: 999,
                    }}
                />

                <div
                    className="pm-skeleton"
                    style={{
                        height: 18,
                        width: "80%",
                        borderRadius: 999,
                    }}
                />

                <div
                    className="pm-skeleton"
                    style={{
                        height: 18,
                        width: "55%",
                        borderRadius: 999,
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 8,
                    }}
                >
                    <div
                        className="pm-skeleton"
                        style={{
                            height: 40,
                            flex: 1,
                            borderRadius: 12,
                        }}
                    />

                    <div
                        className="pm-skeleton"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}