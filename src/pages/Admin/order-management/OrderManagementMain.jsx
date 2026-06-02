import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

import AdminChatPopup from "../chat-management/AdminChatPopup";
import OrderManagementCard from "./OrderManagementCard";
import OrderManagementTable from "./OrderManagementTable";

const ITEMS_PER_PAGE = 7;

export default function OrderManagementMain() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [chatOrder, setChatOrder] = useState(null);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Semua");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel("admin-orders-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                () => fetchOrders(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "order_items" },
                () => fetchOrders(false)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (value) => {
        if (!value) return "-";

        return new Date(value).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const fetchOrders = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            id,
            qty,
            quantity,
            price,
            product_name,
            reference_image_url,
            custom_note,
            products:product_id (
              id,
              name,
              image_url
            )
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const formatted = (data || []).map((order) => {
                const orderItems = order.order_items || [];

                const productNames = orderItems
                    .map((item) => item.products?.name || item.product_name)
                    .filter(Boolean);

                const itemCount = orderItems.reduce((sum, item) => {
                    return sum + Number(item.qty ?? item.quantity ?? 0);
                }, 0);

                const total =
                    order.total_price ??
                    order.total ??
                    orderItems.reduce((sum, item) => {
                        const qty = Number(item.qty ?? item.quantity ?? 0);
                        return sum + Number(item.price || 0) * qty;
                    }, 0);

                const source = order.order_source || (order.user_id ? "online" : "offline");

                return {
                    ...order,
                    order_source: source,
                    itemCount,
                    productSummary:
                        productNames.length > 0 ? productNames.join(", ") : order.product || "-",
                    customerName:
                        order.customer ||
                        order.customer_name ||
                        order.name ||
                        order.user_id?.slice(0, 8) ||
                        "Walk In Customer",
                    phone: order.phone || "-",
                    dateFormatted: formatDate(order.created_at || order.order_date),
                    totalFormatted: formatRupiah(total),
                    totalValue: total,
                };
            });

            setOrders(formatted);
        } catch (error) {
            console.error("Fetch orders error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const updateStatus = async (order, newStatus) => {
        try {
            setUpdatingId(order.id);

            const payload = {
                status: newStatus,
            };

            if (newStatus === "Selesai") {
                payload.payment_status = "paid";
            }

            if (newStatus === "Dibatalkan") {
                payload.payment_status =
                    order.payment_status === "paid" ? "paid" : "cancelled";
            }

            const { error } = await supabase
                .from("orders")
                .update(payload)
                .eq("id", order.id);

            if (error) throw error;

            setOrders((prev) =>
                prev.map((item) =>
                    item.id === order.id ? { ...item, ...payload } : item
                )
            );
        } catch (error) {
            console.error("Update status error:", error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDetail = (order) => {
        navigate(`/management-order/${encodeURIComponent(order.id)}`);
    };

    const handleAccept = (order) => {
        updateStatus(order, "Diproses");
    };

    const handleReject = (order) => {
        updateStatus(order, "Dibatalkan");
    };

    const handleComplete = (order) => {
        updateStatus(order, "Selesai");
    };

    const filteredOrders = useMemo(() => {
        const q = search.toLowerCase();

        return orders.filter((order) => {
            const source = order.order_source || "online";

            const matchSearch =
                order.id?.toLowerCase().includes(q) ||
                order.customerName?.toLowerCase().includes(q) ||
                order.productSummary?.toLowerCase().includes(q) ||
                source.toLowerCase().includes(q);

            let matchFilter = true;

            if (filter === "Online") {
                matchFilter = source === "online";
            } else if (filter === "Offline") {
                matchFilter = source === "offline";
            } else if (filter !== "Semua") {
                matchFilter = order.status === filter;
            }

            return matchSearch && matchFilter;
        });
    }, [orders, search, filter]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

    const paginatedOrders = filteredOrders.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    const stats = {
        total: orders.length,
        online: orders.filter((o) => o.order_source === "online").length,
        offline: orders.filter((o) => o.order_source === "offline").length,
        masuk: orders.filter((o) => o.status === "Masuk").length,
        diproses: orders.filter((o) => o.status === "Diproses").length,
        selesai: orders.filter((o) => o.status === "Selesai").length,
        dibatalkan: orders.filter((o) => o.status === "Dibatalkan").length,
        openBill: orders.filter((o) => o.status === "Open Bill").length,
        revenue: orders
            .filter((o) => o.status === "Selesai")
            .reduce((sum, order) => sum + Number(order.totalValue || 0), 0),
        onlineRevenue: orders
            .filter((o) => o.status === "Selesai" && o.order_source === "online")
            .reduce((sum, order) => sum + Number(order.totalValue || 0), 0),
        offlineRevenue: orders
            .filter((o) => o.status === "Selesai" && o.order_source === "offline")
            .reduce((sum, order) => sum + Number(order.totalValue || 0), 0),
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                    <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />

                    <div className="text-center">
                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Memuat Order...
                        </h2>
                        <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-6 py-8 text-[#4A2C2A]">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <p className="text-xs font-black text-[#8B5E3C] uppercase tracking-widest">
                        Doubleyou.Cake Admin
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black mt-2">
                        Manajemen Order
                    </h1>

                    <p className="text-[#6B4E4C] mt-2 font-semibold">
                        Pantau pesanan online, offline POS, dan open bill secara real-time.
                    </p>
                </div>

                <OrderManagementCard stats={stats} formatRupiah={formatRupiah} />

                <OrderManagementTable
                    orders={paginatedOrders}
                    search={search}
                    setSearch={setSearch}
                    filter={filter}
                    setFilter={setFilter}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    onDetail={handleDetail}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                    onChat={(order) => setChatOrder(order)}
                    updatingId={updatingId}
                />

                <AdminChatPopup
                    open={!!chatOrder}
                    onClose={() => setChatOrder(null)}
                    customerId={chatOrder?.customer_id || chatOrder?.user_id}
                    orderId={chatOrder?.id}
                    customerName={
                        chatOrder?.customerName ||
                        chatOrder?.customer ||
                        chatOrder?.customer_name ||
                        "Customer"
                    }
                />
            </div>
        </div>
    );
}