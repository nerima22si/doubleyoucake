import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import {
    ArrowLeft,
    Package,
    User,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    CheckCircle2,
    XCircle,
    Clock3,
    Printer,
    Eye,
    X,
    ShoppingBag,
    MessageCircle,
} from "lucide-react";
import AdminChatPopup from "../chat-management/AdminChatPopup";

const STATUS_CONFIG = {
    Masuk: { bg: "#FFF7ED", color: "#C2410C" },
    Diproses: { bg: "#EFF6FF", color: "#1D4ED8" },
    Selesai: { bg: "#F0FDF4", color: "#15803D" },
    Dibatalkan: { bg: "#FEF2F2", color: "#B91C1C" },
};

const MILESTONES = ["Masuk", "Diproses", "Selesai"];

export default function OrderManagementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const orderId = decodeURIComponent(id || "");

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        fetchOrder();

        const channel = supabase
            .channel(`admin-order-detail-${orderId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
                () => fetchOrder(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${orderId}` },
                () => fetchOrder(false)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const fetchOrder = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();

            if (orderError) throw orderError;

            const { data: itemData, error: itemError } = await supabase
                .from("order_items")
                .select(`
                    id,
                    order_id,
                    product_id,
                    qty,
                    price,
                    reference_image_url,
                    custom_note,
                    products:product_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .eq("order_id", orderId);

            if (itemError) throw itemError;

            setOrder(orderData);
            setItems(itemData || []);
        } catch (error) {
            console.error("Fetch order detail error:", error.message);
            setOrder(null);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            if (!order) return;

            setUpdating(true);

            const payload = { status: newStatus };

            if (newStatus === "Selesai") {
                payload.payment_status = "paid";
            }

            const { error } = await supabase
                .from("orders")
                .update(payload)
                .eq("id", order.id);

            if (error) throw error;

            setOrder((prev) => ({ ...prev, ...payload }));
        } catch (error) {
            alert("Gagal update status: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const totalOrder =
        order?.total_price ??
        order?.total ??
        items.reduce(
            (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
            0
        );

    const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    const getMilestoneActive = (step) => {
        if (order?.status === "Dibatalkan") return false;
        const currentIndex = MILESTONES.indexOf(order?.status);
        const stepIndex = MILESTONES.indexOf(step);
        return stepIndex <= currentIndex;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                    <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />
                    <div className="text-center">
                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Memuat Detail Order...
                        </h2>
                        <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] p-8 text-[#4A2C2A]">
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-bold"
                >
                    Kembali
                </button>

                <div className="mt-8 bg-white border border-[#EBD9C1] rounded-[2rem] p-8">
                    <h2 className="text-2xl font-black">Order tidak ditemukan</h2>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }

                        #receipt-area,
                        #receipt-area * {
                            visibility: visible;
                        }

                        #receipt-area {
                            position: absolute;
                            left: 50%;
                            top: 0;
                            transform: translateX(-50%);
                            width: 380px;
                            background: white;
                            padding: 24px;
                            color: #111;
                            font-family: Arial, sans-serif;
                        }

                        .no-print {
                            display: none !important;
                        }
                        }
                    `}
            </style>


            <div className="min-h-screen shadow rounded-2xl bg-[#FFFBF5] text-[#4A2C2A] px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-fit flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-bold shadow-lg hover:bg-gradient-to-r hover:from-[#4A2C2A] hover:via-[#8B5E3C] hover:to-[#C08B5C] transition-all"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </button>

                        <button
                            onClick={handlePrint}
                            className="w-fit flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#EBD9C1] text-[#4A2C2A] font-black shadow-sm hover:bg-[#FDF5E6]"
                        >
                            <Printer size={18} />
                            Cetak Struk
                        </button>

                        <button
                            onClick={() => setChatOpen(true)}
                            className="w-fit flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FDF5E6] border border-[#EBD9C1] text-[#4A2C2A] font-black shadow-sm hover:bg-[#4A2C2A] hover:text-white transition-all"
                        >
                            <MessageCircle size={18} />
                            Hubungi Customer
                        </button>
                    </div>

                    <div id="print-area">
                        <div className="mb-8">
                            <p className="text-xs font-black text-[#8B5E3C] uppercase tracking-widest">
                                Doubleyou.Cake Admin
                            </p>

                            <h1 className="text-4xl md:text-5xl font-black mt-2">
                                Detail Order
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span className="text-lg font-black">{order.id}</span>
                                <Badge status={order.status} />
                                <span className="text-sm font-semibold text-[#6B4E4C]">
                                    {formatDate(order.created_at || order.order_date)}
                                </span>
                            </div>
                        </div>

                        <div className="no-print bg-white rounded-[2rem] border border-[#EBD9C1] p-6 mb-8 shadow-sm">
                            <h2 className="text-xl font-black mb-5">Milestone Pesanan</h2>

                            {order.status === "Dibatalkan" ? (
                                <div className="flex items-center gap-3 text-red-600 font-black">
                                    <XCircle size={24} />
                                    Pesanan Dibatalkan
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {MILESTONES.map((step, index) => {
                                        const active = getMilestoneActive(step);

                                        return (
                                            <div
                                                key={step}
                                                className={`rounded-3xl p-5 border ${active
                                                    ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                                                    : "bg-[#FFFBF5] text-[#8B5E3C] border-[#EBD9C1]"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${active
                                                            ? "bg-white text-[#4A2C2A]"
                                                            : "bg-white text-[#8B5E3C]"
                                                            }`}
                                                    >
                                                        {active ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold opacity-80">
                                                            Step {index + 1}
                                                        </p>
                                                        <h3 className="font-black">{step}</h3>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card title="Data Customer" icon={<User size={22} />}>
                                    <InfoRow label="Nama Customer" value={order.customer || order.customer_name || "-"} />
                                    <InfoRow label="Telepon" value={order.phone || "-"} icon={<Phone size={16} />} />
                                    <InfoRow label="Alamat" value={order.shipping_address || "-"} icon={<MapPin size={16} />} />
                                    <InfoRow label="Catatan Order" value={order.notes || "-"} icon={<FileText size={16} />} />
                                </Card>

                                <Card title="Produk Dipesan" icon={<Package size={22} />}>
                                    <div className="space-y-5">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-[1.5rem] border border-[#EBD9C1] bg-[#FFFBF5] p-5"
                                            >
                                                <div className="flex gap-4">
                                                    <img
                                                        src={item.products?.image_url}
                                                        alt={item.products?.name}
                                                        className="w-24 h-24 rounded-2xl object-cover bg-white border border-[#EBD9C1]"
                                                    />

                                                    <div className="flex-1">
                                                        <h3 className="font-black text-lg">
                                                            {item.products?.name || "Produk"}
                                                        </h3>
                                                        <p className="font-bold text-[#8B5E3C] mt-1">
                                                            {item.qty} x {formatRupiah(item.price)}
                                                        </p>
                                                        <p className="font-black mt-1">
                                                            Total: {formatRupiah(Number(item.qty) * Number(item.price))}
                                                        </p>
                                                    </div>
                                                </div>

                                                {(item.reference_image_url || item.custom_note) && (
                                                    <div className="mt-5 rounded-2xl bg-white border border-[#EBD9C1] p-4">
                                                        <p className="font-black text-sm mb-3">
                                                            Request Custom Cake
                                                        </p>

                                                        {item.reference_image_url && (
                                                            <div className="mb-3">
                                                                <img
                                                                    src={item.reference_image_url}
                                                                    alt="Foto referensi custom cake"
                                                                    onClick={() => setPreviewImage(item.reference_image_url)}
                                                                    className="w-32 h-32 object-cover rounded-2xl border border-[#EBD9C1] cursor-pointer hover:scale-105 transition-all"
                                                                />

                                                                <button
                                                                    onClick={() => setPreviewImage(item.reference_image_url)}
                                                                    className="no-print mt-2 flex items-center gap-2 text-xs font-black text-[#8B5E3C]"
                                                                >
                                                                    <Eye size={14} />
                                                                    Lihat Preview
                                                                </button>
                                                            </div>
                                                        )}

                                                        {item.custom_note && (
                                                            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                                                                {item.custom_note}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-8 space-y-6">
                                    <Card title="Ringkasan Order" icon={<ShoppingBag size={22} />}>
                                        <div className="space-y-4">
                                            <SummaryRow label="Total Item" value={`${totalQty} item`} />
                                            <SummaryRow label="Subtotal" value={formatRupiah(totalOrder)} />
                                            <SummaryRow label="Metode Bayar" value={order.payment_method || "-"} />
                                            <SummaryRow label="Status Bayar" value={order.payment_status || "pending"} />
                                            <div className="border-t border-[#EBD9C1] pt-4 flex justify-between items-center">
                                                <span className="text-lg font-black">Total</span>
                                                <span className="text-2xl font-black text-[#8B5E3C]">
                                                    {formatRupiah(totalOrder)}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="no-print bg-white rounded-[2rem] border border-[#EBD9C1] p-6 shadow-sm">
                                        <h2 className="text-xl font-black mb-4">Aksi Admin</h2>

                                        {order.status === "Masuk" && (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => updateStatus("Diproses")}
                                                    disabled={updating}
                                                    className="w-full py-4 rounded-2xl bg-[#4A2C2A] text-white font-black hover:bg-gradient-to-r hover:from-[#4A2C2A] hover:via-[#8B5E3C] hover:to-[#C08B5C] disabled:opacity-60"
                                                >
                                                    {updating ? "Memproses..." : "Accept Order"}
                                                </button>

                                                <button
                                                    onClick={() => updateStatus("Dibatalkan")}
                                                    disabled={updating}
                                                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 disabled:opacity-60"
                                                >
                                                    Tolak Order
                                                </button>
                                            </div>
                                        )}

                                        {order.status === "Diproses" && (
                                            <button
                                                onClick={() => updateStatus("Selesai")}
                                                disabled={updating}
                                                className="w-full py-4 rounded-2xl bg-green-600 text-white font-black hover:bg-green-700 disabled:opacity-60"
                                            >
                                                {updating ? "Memproses..." : "Tandai Selesai"}
                                            </button>
                                        )}

                                        {order.status === "Selesai" && (
                                            <div className="rounded-2xl bg-green-50 text-green-700 p-4 font-black text-center">
                                                Order sudah selesai
                                            </div>
                                        )}

                                        {order.status === "Dibatalkan" && (
                                            <div className="rounded-2xl bg-red-50 text-red-700 p-4 font-black text-center">
                                                Order dibatalkan
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ReceiptPrint
                order={order}
                items={items}
                totalOrder={totalOrder}
                totalQty={totalQty}
                formatRupiah={formatRupiah}
                formatDate={formatDate}
            />

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-4 -right-4 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#4A2C2A] font-black"
                        >
                            <X size={22} />
                        </button>

                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl bg-white"
                        />
                    </div>
                </div>
            )}
            <AdminChatPopup
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                customerId={order?.customer_id || order?.user_id}
                orderId={order?.id}
                customerName={
                    order?.customer ||
                    order?.customer_name ||
                    order?.customerName ||
                    "Customer"
                }
            />
        </>
    );
}

function Badge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Masuk;

    return (
        <span
            style={{ background: cfg.bg, color: cfg.color }}
            className="px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
        >
            {status}
        </span>
    );
}

function Card({ title, icon, children }) {
    return (
        <div className="bg-white rounded-[2rem] border border-[#EBD9C1] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                    {icon}
                </div>
                <h2 className="text-xl font-black">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function InfoRow({ label, value, icon }) {
    return (
        <div className="mb-4 last:mb-0">
            <p className="text-xs font-black text-[#8B5E3C] uppercase mb-1 flex items-center gap-1">
                {icon}
                {label}
            </p>
            <p className="font-bold text-[#4A2C2A]">{value}</p>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 text-sm font-bold text-slate-500">
            <span>{label}</span>
            <span className="text-[#4A2C2A] text-right">{value}</span>
        </div>
    );
}
function ReceiptPrint({ order, items, totalOrder, totalQty, formatRupiah, formatDate }) {
    return (
        <div id="receipt-area" className="hidden print:block">
            <div className="text-center">
                <h1 className="text-2xl font-black">Doubleyou.Cake</h1>
                <p className="text-xs mt-1">Custom Cake & Dessert</p>
                <p className="text-xs">Pekanbaru, Indonesia</p>
                <p className="text-xs">WhatsApp: 08xxxxxxxxxx</p>
            </div>

            <div className="border-t border-dashed border-black my-4" />

            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>No Order</span>
                    <span>{order.id}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{formatDate(order.created_at || order.order_date)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Customer</span>
                    <span>{order.customer || order.customer_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                    <span>Status</span>
                    <span>{order.status}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-4" />

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="text-xs">
                        <p className="font-bold">
                            {item.products?.name || "Produk"}
                        </p>

                        <div className="flex justify-between mt-1">
                            <span>
                                {item.qty} x {formatRupiah(item.price)}
                            </span>
                            <span>
                                {formatRupiah(
                                    Number(item.qty || 0) * Number(item.price || 0)
                                )}
                            </span>
                        </div>

                        {item.custom_note && (
                            <p className="text-[10px] mt-1">
                                Catatan: {item.custom_note}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-black my-4" />

            <div className="text-xs space-y-2">
                <div className="flex justify-between">
                    <span>Total Item</span>
                    <span>{totalQty} item</span>
                </div>

                <div className="flex justify-between">
                    <span>Metode Bayar</span>
                    <span>{order.payment_method || "-"}</span>
                </div>

                <div className="flex justify-between">
                    <span>Status Bayar</span>
                    <span>{order.payment_status || "pending"}</span>
                </div>

                <div className="flex justify-between text-base font-black border-t border-black pt-3 mt-3">
                    <span>Total</span>
                    <span>{formatRupiah(totalOrder)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-black my-4" />

            <div className="text-center text-xs">
                <p className="font-bold">Terima kasih sudah berbelanja</p>
                <p>Pesanan dibuat dengan penuh cinta ♡</p>
                <p className="mt-3">Instagram: @doubleyou.cake</p>
            </div>
        </div>
    );
}