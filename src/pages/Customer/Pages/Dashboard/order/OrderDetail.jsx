import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../../../lib/supabase";
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    MessageSquare,
    Clock3,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { MdKeyboardArrowLeft } from "react-icons/md";

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetail();

        const channel = supabase
            .channel("order-detail-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `id=eq.${id}`,
                },
                () => fetchOrderDetail()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "order_items",
                },
                () => fetchOrderDetail()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const getStatusUI = (status) => {
        switch (status) {
            case "Masuk":
                return {
                    bg: "bg-orange-100",
                    text: "text-orange-700",
                    icon: <Clock3 size={16} />,
                    label: "Masuk",
                };

            case "Diproses":
                return {
                    bg: "bg-blue-100",
                    text: "text-blue-700",
                    icon: <Package size={16} />,
                    label: "Diproses",
                };

            case "Selesai":
                return {
                    bg: "bg-green-100",
                    text: "text-green-700",
                    icon: <CheckCircle2 size={16} />,
                    label: "Selesai",
                };

            case "Dibatalkan":
                return {
                    bg: "bg-red-100",
                    text: "text-red-700",
                    icon: <XCircle size={16} />,
                    label: "Dibatalkan",
                };

            default:
                return {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    icon: <Package size={16} />,
                    label: status || "Masuk",
                };
        }
    };

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                navigate("/login");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              image_url,
              price
            )
          )
        `)
                .eq("id", id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;

            setOrder(data);
        } catch (error) {
            console.error("Fetch order detail error:", error);
            alert("Gagal mengambil detail pesanan: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

                <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                    <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                        <div
                            className="
                            w-16
                            h-16
                            rounded-full
                            border-[5px]
                            border-[#EBD9C1]
                            border-t-[#4A2C2A]
                            animate-spin
                        "
                        />

                        <div className="text-center">
                            <h2 className="text-xl font-black text-[#4A2C2A]">
                                Memuat Data...
                            </h2>

                            <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                                Mohon tunggu sebentar
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-[#FFFBF5]  shadow-2xl rounded-2xl flex items-center justify-center px-6">
                <div className="bg-white rounded-[2.5rem] p-10 text-center border border-[#EBD9C1] shadow-sm">
                    <h2 className="text-2xl font-black text-[#4A2C2A]">
                        Pesanan tidak ditemukan
                    </h2>

                    <button
                        onClick={() => navigate("/customer/my-orders")}
                        className="mt-6 px-8 py-3 bg-[#4A2C2A] text-white rounded-full font-black hover:bg-[#8B5E3C]"
                    >
                        Kembali ke Pesanan
                    </button>
                </div>
            </div>
        );
    }

    const statusUI = getStatusUI(order.status);

    return (
        <div className="min-h-screen shadow rounded-2xl  bg-[#FFFBF5] text-[#4A2C2A] px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate("/customer/my-orders")}
                    className="
                                                mb-8
                                                flex
                                                items-center
                                                gap-2
                                                px-5
                                                py-3
                                                rounded-2xl
                                                bg-[#4A2C2A]
                                                border
                                                
                                                text-sm
                                                font-bold
                                                text-white
                                                shadow-lg
                                                hover:scale-[1.02]
                                                hover:shadow-2xl
                                                hover:bg-gradient-to-r
                                                hover:from-[#4A2C2A]
                                                hover:via-[#8B5E3C]
                                                hover:to-[#C08B5C]
                                                transition-all
                                                duration-300
                                            "
                                        >
                                            <MdKeyboardArrowLeft size={18} /> Kembali
                                            
                                        </button>

                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#EBD9C1]/70 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div>
                            <p className="text-sm font-black text-[#8B5E3C] uppercase tracking-widest">
                                Detail Pesanan
                            </p>

                            <h1 className="text-3xl md:text-5xl font-black mt-2">
                                {order.id}
                            </h1>

                            <p className="text-slate-500 font-medium mt-2">
                                {new Date(order.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>

                        <div
                            className={`flex items-center gap-2 px-5 py-3 rounded-full w-fit font-black text-sm ${statusUI.bg} ${statusUI.text}`}
                        >
                            {statusUI.icon}
                            {statusUI.label}
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] p-7 border border-[#EBD9C1]/70 shadow-sm">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                <Package className="text-[#8B5E3C]" />
                                Produk Dipesan
                            </h2>

                            <div className="space-y-5">
                                {order.order_items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col md:flex-row md:items-center gap-5 border-b border-[#F1E4D1] pb-5 last:border-b-0 last:pb-0"
                                    >
                                        <img
                                            src={item.products?.image_url}
                                            alt={item.products?.name}
                                            className="w-full md:w-24 h-40 md:h-24 rounded-3xl object-cover bg-[#FDF5E6]"
                                        />

                                        <div className="flex-1">
                                            <h3 className="font-black text-lg">
                                                {item.products?.name}
                                            </h3>

                                            <p className="text-sm text-slate-500 font-bold mt-1">
                                                Qty: {item.qty}
                                            </p>

                                            <p className="text-sm text-slate-500 font-bold">
                                                Harga: {formatRupiah(item.price)}
                                            </p>
                                        </div>

                                        <div className="font-black text-[#8B5E3C] text-lg">
                                            {formatRupiah(item.price * item.qty)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-7 border border-[#EBD9C1]/70 shadow-sm">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                                <MapPin className="text-[#8B5E3C]" />
                                Alamat Pengiriman
                            </h2>

                            <p className="text-slate-600 font-medium leading-relaxed">
                                {order.shipping_address || "-"}
                            </p>
                        </div>

                        <div className="bg-white rounded-[2rem] p-7 border border-[#EBD9C1]/70 shadow-sm">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-3">
                                <MessageSquare className="text-[#8B5E3C]" />
                                Catatan
                            </h2>

                            <p className="text-slate-600 font-medium leading-relaxed">
                                {order.notes || "Tidak ada catatan."}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-8 bg-white rounded-[2.5rem] p-7 shadow-xl border border-[#EBD9C1]/70">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                <CreditCard className="text-[#8B5E3C]" />
                                Pembayaran
                            </h2>

                            <div className="space-y-4 border-b border-[#EBD9C1] pb-5">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Metode</span>
                                    <span>{order.payment_method || "-"}</span>
                                </div>

                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Status Bayar</span>
                                    <span>{order.payment_status || "pending"}</span>
                                </div>

                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Status Order</span>
                                    <span>{statusUI.label}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <span className="text-lg font-black">Total</span>

                                <span className="text-2xl font-black text-[#8B5E3C]">
                                    {formatRupiah(order.total_price)}
                                </span>
                            </div>

                            <button
                                onClick={() => navigate("/customer/my-orders")}
                                className="mt-8 w-full py-5 rounded-3xl bg-[#4A2C2A] text-white font-black text-lg hover:bg-[#8B5E3C] transition-all shadow-xl"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;