import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import {
    ShoppingBag,
    Package,
    CheckCircle2,
    Clock3,
    ChevronRight,
    Search,
    ShoppingCart,
    ReceiptText,
    CakeSlice,
} from "lucide-react";

const COLORS = {
    bg: "#FFFBF5",
    white: "#FFFFFF",
    cream: "#FDF5E6",
    border: "#EBD9C1",
    primary: "#4A2C2A",
    secondary: "#8B5E3C",
    caramel: "#C08B5C",
    muted: "#6B4E4C",
};

export default function CustDashboard() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();

        const channel = supabase
            .channel("customer-dashboard-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchDashboard(false))
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchDashboard(false))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchDashboard = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (!user) {
                navigate("/login");
                return;
            }

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            setProfile(profileData);

            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        *,
                        products:product_id (
                            id,
                            name,
                            image_url
                        )
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (orderError) throw orderError;
            setOrders(orderData || []);

            const { data: productData, error: productError } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(3);

            if (productError) throw productError;
            setProducts(productData || []);
        } catch (error) {
            console.error("Dashboard error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const totalOrders = orders.length;
    const masukOrders = orders.filter((o) => o.status === "Masuk").length;
    const prosesOrders = orders.filter((o) => o.status === "Diproses").length;
    const selesaiOrders = orders.filter((o) => o.status === "Selesai").length;

    const stats = [
        { title: "Total Pesanan", value: totalOrders, icon: <ShoppingBag size={20} /> },
        { title: "Pesanan Masuk", value: masukOrders, icon: <Clock3 size={20} /> },
        { title: "Diproses", value: prosesOrders, icon: <Package size={20} /> },
        { title: "Selesai", value: selesaiOrders, icon: <CheckCircle2 size={20} /> },
    ];

    const recentOrders = orders.slice(0, 3);

    const filteredProducts = products.filter((product) =>
        product.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <h2 style={styles.loadingTitle}>Memuat Dashboard...</h2>
                    <p style={styles.loadingSubtitle}>Mohon tunggu sebentar</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .theme-btn {
                    transition: all .3s ease;
                }

                .theme-btn:hover {
                    background: linear-gradient(135deg, #4A2C2A, #8B5E3C, #C08B5C) !important;
                    color: white !important;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(74, 44, 42, .25);
                }

                .soft-card {
                    transition: all .3s ease;
                }

                .soft-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 18px 38px rgba(74, 44, 42, .12);
                }
            `}</style>

            <div style={styles.page}>
                <div style={styles.topbar}>
                    <div>
                        <p style={styles.breadcrumb}>Home • Dashboard</p>
                        <h1 style={styles.heading}>Dashboard Customer</h1>
                    </div>

                    <div style={styles.searchBox}>
                        <Search size={18} color={COLORS.secondary} />
                        <input
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                <section style={styles.hero}>
                    <div style={styles.heroContent}>
                        <p style={styles.heroMini}>DOUBLEYOU.CAKE</p>

                        <h2 style={styles.heroTitle}>
                            Halo, {profile?.full_name || profile?.name || "Customer"}
                        </h2>

                        <p style={styles.heroDesc}>
                            Pilih kue favoritmu, cek keranjang, dan pantau status pesananmu langsung dari dashboard ini.
                        </p>

                        <div style={styles.heroActions}>
                            <button
                                onClick={() => navigate("/customer/products")}
                                style={styles.heroButton}
                                className="theme-btn"
                            >
                                <CakeSlice size={18} />
                                Lihat Produk
                            </button>

                            <button
                                onClick={() => navigate("/customer/cart")}
                                style={styles.heroButtonSecondary}
                                className="theme-btn"
                            >
                                <ShoppingCart size={18} />
                                Keranjang
                            </button>
                        </div>
                    </div>

                    <div style={styles.heroBlob1} />
                    <div style={styles.heroBlob2} />
                </section>

                <section style={styles.statsGrid}>
                    {stats.map((item, index) => (
                        <div key={index} style={styles.statsCard} className="soft-card">
                            <div style={styles.statsIcon}>{item.icon}</div>
                            <div>
                                <p style={styles.statsTitle}>{item.title}</p>
                                <h3 style={styles.statsValue}>{item.value}</h3>
                            </div>
                        </div>
                    ))}
                </section>

                <div style={styles.quickActions}>
                    <button
                        onClick={() => navigate("/customer/products")}
                        style={styles.quickButton}
                        className="theme-btn"
                    >
                        <CakeSlice size={20} />
                        Lihat Semua Produk
                    </button>

                    <button
                        onClick={() => navigate("/customer/cart")}
                        style={styles.quickButton}
                        className="theme-btn"
                    >
                        <ShoppingCart size={20} />
                        Buka Keranjang
                    </button>

                    <button
                        onClick={() => navigate("/customer/my-orders")}
                        style={styles.quickButton}
                        className="theme-btn"
                    >
                        <ReceiptText size={20} />
                        Riwayat Pesanan
                    </button>
                </div>

                <div style={styles.contentGrid}>
                    <section style={styles.card}>
                        <div style={styles.sectionHeader}>
                            <div>
                                <p style={styles.sectionMini}>REKOMENDASI</p>
                                <h3 style={styles.sectionTitle}>Produk Terbaru</h3>
                            </div>

                            <button
                                onClick={() => navigate("/customer/products")}
                                style={styles.viewAll}
                                className="theme-btn"
                            >
                                Lihat Semua
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <p style={styles.emptyText}>Belum ada produk tersedia.</p>
                        ) : (
                            <div style={styles.cakeGrid}>
                                {filteredProducts.map((product) => (
                                    <div key={product.id} style={styles.cakeCard} className="soft-card">
                                        <img src={product.image_url} alt={product.name} style={styles.cakeImage} />

                                        <div style={styles.cakeContent}>
                                            <h4 style={styles.cakeTitle}>{product.name}</h4>
                                            <p style={styles.cakePrice}>{formatRupiah(product.price)}</p>

                                            <button
                                                onClick={() => navigate("/customer/products")}
                                                style={styles.buyButton}
                                                className="theme-btn"
                                            >
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section style={styles.card}>
                        <div style={styles.sectionHeader}>
                            <div>
                                <p style={styles.sectionMini}>PESANAN</p>
                                <h3 style={styles.sectionTitle}>Pesanan Terakhir</h3>
                            </div>

                            <button
                                onClick={() => navigate("/customer/my-orders")}
                                style={styles.viewAll}
                                className="theme-btn"
                            >
                                Lihat Semua
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {recentOrders.length === 0 ? (
                            <p style={styles.emptyText}>Belum ada pesanan.</p>
                        ) : (
                            <div style={styles.orderList}>
                                {recentOrders.map((order) => (
                                    <OrderItem
                                        key={order.id}
                                        order={order}
                                        navigate={navigate}
                                        formatRupiah={formatRupiah}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

function OrderItem({ order, navigate, formatRupiah }) {
    const firstItem = order.order_items?.[0];

    return (
        <div style={styles.orderItem}>
            <div style={styles.orderIcon}>
                <Package size={18} />
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={styles.orderTitle}>
                    {firstItem?.products?.name || order.id}
                </h4>

                <p style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>

                <p style={styles.orderTotal}>
                    {formatRupiah(order.total_price)}
                </p>
            </div>

            <div style={styles.statusBadge}>{order.status}</div>

            <button
                onClick={() => navigate(`/customer/my-orders/${order.id}`)}
                style={styles.detailButton}
                className="theme-btn"
            >
                Detail
            </button>
        </div>
    );
}

const styles = {
    loadingPage: {
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    loadingCard: {
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 32,
        padding: "40px 46px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        boxShadow: "0 18px 45px rgba(74,44,42,0.08)",
    },

    spinner: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: `5px solid ${COLORS.border}`,
        borderTop: `5px solid ${COLORS.primary}`,
        animation: "spin 1s linear infinite",
    },

    loadingTitle: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 800,
        margin: 0,
    },

    loadingSubtitle: {
        color: COLORS.muted,
        fontSize: 14,
        margin: 0,
    },

    page: {
        minHeight: "100vh",
        background: COLORS.bg,
        padding: "24px",
        fontFamily: "'Poppins', sans-serif",
        color: COLORS.primary,
    },

    topbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
        flexWrap: "wrap",
        gap: 16,
    },

    breadcrumb: {
        color: COLORS.muted,
        fontSize: 13,
        marginBottom: 6,
        fontWeight: 600,
    },

    heading: {
        fontSize: "clamp(28px,4vw,38px)",
        fontWeight: 900,
        color: COLORS.primary,
        margin: 0,
    },

    searchBox: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        padding: "12px 16px",
        borderRadius: 999,
        width: "100%",
        maxWidth: 360,
        boxShadow: "0 8px 24px rgba(74,44,42,0.05)",
    },

    searchInput: {
        border: "none",
        outline: "none",
        flex: 1,
        fontSize: 14,
        background: "transparent",
        color: COLORS.primary,
        fontWeight: 600,
    },

    hero: {
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg,#4A2C2A 0%,#8B5E3C 55%,#C08B5C 100%)",
        borderRadius: 34,
        padding: "clamp(26px,5vw,46px)",
        minHeight: 260,
        marginBottom: 28,
        boxShadow: "0 24px 55px rgba(74,44,42,0.25)",
    },

    heroContent: {
        position: "relative",
        zIndex: 2,
        maxWidth: 650,
    },

    heroMini: {
        color: "rgba(255,255,255,0.75)",
        letterSpacing: 3,
        fontSize: 11,
        fontWeight: 900,
        marginBottom: 12,
    },

    heroTitle: {
        fontSize: "clamp(34px,6vw,58px)",
        color: "#fff",
        lineHeight: 1.1,
        marginBottom: 14,
        fontWeight: 900,
    },

    heroDesc: {
        color: "rgba(255,255,255,0.86)",
        fontSize: 15,
        lineHeight: 1.8,
        marginBottom: 24,
        fontWeight: 500,
    },

    heroActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
    },

    heroButton: {
        border: "none",
        background: COLORS.white,
        color: COLORS.primary,
        padding: "14px 22px",
        borderRadius: 999,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    heroButtonSecondary: {
        border: "1px solid rgba(255,255,255,0.55)",
        background: "rgba(255,255,255,0.14)",
        color: "#fff",
        padding: "14px 22px",
        borderRadius: 999,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    heroBlob1: {
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
        right: -100,
        top: -100,
    },

    heroBlob2: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.10)",
        left: 40,
        bottom: -60,
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 18,
        marginBottom: 22,
    },

    statsCard: {
        background: COLORS.white,
        borderRadius: 26,
        padding: 22,
        display: "flex",
        alignItems: "center",
        gap: 18,
        border: `1px solid ${COLORS.border}`,
    },

    statsIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        background: COLORS.cream,
        color: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    statsTitle: {
        fontSize: 13,
        color: COLORS.muted,
        marginBottom: 6,
        fontWeight: 600,
    },

    statsValue: {
        fontSize: 28,
        color: COLORS.primary,
        fontWeight: 900,
    },

    quickActions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 28,
    },

    quickButton: {
        border: `1px solid ${COLORS.border}`,
        background: COLORS.white,
        color: COLORS.primary,
        padding: "14px 18px",
        borderRadius: 20,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },

    contentGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: 22,
    },

    card: {
        background: COLORS.white,
        borderRadius: 30,
        padding: 24,
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 14px 35px rgba(74,44,42,0.06)",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
        flexWrap: "wrap",
        gap: 12,
    },

    sectionMini: {
        fontSize: 11,
        letterSpacing: 3,
        color: COLORS.secondary,
        marginBottom: 4,
        fontWeight: 900,
    },

    sectionTitle: {
        fontSize: "clamp(22px,4vw,28px)",
        color: COLORS.primary,
        margin: 0,
        fontWeight: 900,
    },

    viewAll: {
        border: "none",
        background: COLORS.cream,
        color: COLORS.primary,
        padding: "10px 16px",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontWeight: 800,
    },

    cakeGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18,
    },

    cakeCard: {
        overflow: "hidden",
        borderRadius: 24,
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
    },

    cakeImage: {
        width: "100%",
        height: 170,
        objectFit: "cover",
    },

    cakeContent: {
        padding: 16,
    },

    cakeTitle: {
        fontSize: 16,
        color: COLORS.primary,
        marginBottom: 8,
        fontWeight: 900,
    },

    cakePrice: {
        color: COLORS.secondary,
        fontWeight: 900,
        marginBottom: 14,
    },

    buyButton: {
        width: "100%",
        border: "none",
        background: COLORS.primary,
        color: "#fff",
        padding: 11,
        borderRadius: 14,
        fontWeight: 800,
        cursor: "pointer",
    },

    orderList: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },

    orderItem: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 18,
        borderRadius: 20,
        background: COLORS.bg,
        flexWrap: "wrap",
        border: `1px solid ${COLORS.border}`,
    },

    orderIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        background: COLORS.cream,
        color: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    orderTitle: {
        fontSize: 15,
        color: COLORS.primary,
        marginBottom: 4,
        fontWeight: 900,
    },

    orderDate: {
        fontSize: 13,
        color: COLORS.muted,
        margin: 0,
    },

    orderTotal: {
        fontSize: 13,
        color: COLORS.secondary,
        fontWeight: 900,
        marginTop: 4,
    },

    statusBadge: {
        padding: "8px 14px",
        borderRadius: 999,
        background: COLORS.cream,
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: 900,
    },

    detailButton: {
        border: "none",
        background: COLORS.primary,
        color: "#fff",
        padding: "9px 14px",
        borderRadius: 999,
        fontWeight: 800,
        cursor: "pointer",
    },

    emptyText: {
        color: COLORS.muted,
        fontSize: 14,
        fontWeight: 600,
    },
};