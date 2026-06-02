import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Printer,
    CheckCircle2,
    ReceiptText,
    X,
    Banknote,
    QrCode,
    CreditCard,
    Ban,
    Trash2,
    RotateCcw,
    PackageCheck,
    UserRound,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import AppDialog from "../../../components/AppDialog";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });

export default function OrderPayment() {
    const [orders, setOrders] = useState([]);
    const [cashiers, setCashiers] = useState([]);
    const [search, setSearch] = useState("");

    const [paymentModal, setPaymentModal] = useState({
        open: false,
        order: null,
    });

    const [statusModal, setStatusModal] = useState({
        open: false,
        order: null,
    });

    const [dialog, setDialog] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
        showCancel: false,
        confirmText: "OK",
        cancelText: "Cancel",
        onConfirm: null,
    });

    const showDialog = (payload) => {
        setDialog({
            open: true,
            type: payload.type || "info",
            title: payload.title || "",
            message: payload.message || "",
            showCancel: payload.showCancel || false,
            confirmText: payload.confirmText || "OK",
            cancelText: payload.cancelText || "Cancel",
            onConfirm: payload.onConfirm || null,
        });
    };

    const closeDialog = () => {
        setDialog((prev) => ({
            ...prev,
            open: false,
        }));
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel("admin-order-payment")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                fetchData
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "order_items" },
                fetchData
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles" },
                fetchData
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchData = async () => {
        const [ordersRes, profilesRes] = await Promise.all([
            supabase
                .from("orders")
                .select(`
          id,
          customer_name,
          user_id,
          cashier_id,
          order_source,
          status,
          payment_status,
          payment_method,
          total_price,
          created_at,
          paid_at,
          order_items (
            id,
            product_name,
            price,
            quantity,
            qty,
            products:product_id (
              id,
              name
            )
          )
        `)
                .order("created_at", { ascending: false }),

            supabase
                .from("profiles")
                .select("id, full_name, email, role"),
        ]);

        if (ordersRes.error) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Order",
                message: ordersRes.error.message,
            });
            return;
        }

        if (profilesRes.error) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Data Kasir",
                message: profilesRes.error.message,
            });
            return;
        }

        setOrders(ordersRes.data || []);
        setCashiers(profilesRes.data || []);
    };

    const getCashierName = (cashierId) => {
        if (!cashierId) return "-";

        const cashier = cashiers.find(
            (item) => String(item.id) === String(cashierId)
        );

        return (
            cashier?.full_name ||
            cashier?.email ||
            cashierId.slice(0, 8)
        );
    };

    const filteredOrders = useMemo(() => {
        const q = search.toLowerCase();

        return orders.filter((order) => {
            const cashierName = getCashierName(order.cashier_id).toLowerCase();

            const itemsText = (order.order_items || [])
                .map((item) => item.product_name || item.products?.name || "")
                .join(" ")
                .toLowerCase();

            return (
                String(order.id).toLowerCase().includes(q) ||
                (order.customer_name || "").toLowerCase().includes(q) ||
                (order.status || "").toLowerCase().includes(q) ||
                (order.payment_status || "").toLowerCase().includes(q) ||
                (order.order_source || "").toLowerCase().includes(q) ||
                cashierName.includes(q) ||
                itemsText.includes(q)
            );
        });
    }, [orders, search, cashiers]);

    const updateOrderStatus = async (order, status) => {
        const payload = { status };

        if (status === "Selesai") {
            payload.payment_status = "paid";
            payload.paid_at = new Date().toISOString();
        }

        if (status === "Dibatalkan") {
            payload.payment_status =
                order.payment_status === "paid" ? "paid" : "cancelled";
        }

        const { error } = await supabase
            .from("orders")
            .update(payload)
            .eq("id", order.id);

        if (error) {
            showDialog({
                type: "error",
                title: "Gagal Update Status",
                message: error.message,
            });
            return;
        }

        fetchData();

        showDialog({
            type: "success",
            title: "Status Diperbarui",
            message: `Status order #${order.id} berhasil diubah menjadi ${status}.`,
            confirmText: "Mengerti",
        });
    };

    const cancelOrder = async (order) => {
        showDialog({
            type: "warning",
            title: "Cancel Order?",
            message: `Yakin ingin membatalkan order #${order.id}?`,
            showCancel: true,
            confirmText: "Ya, Cancel",
            cancelText: "Tidak",
            onConfirm: async () => {
                closeDialog();

                const { error } = await supabase
                    .from("orders")
                    .update({
                        status: "Dibatalkan",
                        payment_status:
                            order.payment_status === "paid" ? "paid" : "cancelled",
                    })
                    .eq("id", order.id);

                if (error) {
                    showDialog({
                        type: "error",
                        title: "Gagal Cancel Order",
                        message: error.message,
                    });
                    return;
                }

                fetchData();

                showDialog({
                    type: "success",
                    title: "Order Dibatalkan",
                    message: `Order #${order.id} berhasil dibatalkan.`,
                    confirmText: "Mengerti",
                });
            },
        });
    };

    const deleteOrder = async (order) => {
        showDialog({
            type: "warning",
            title: "Delete Order?",
            message: `Yakin ingin menghapus order #${order.id}? Data item order juga ikut terhapus.`,
            showCancel: true,
            confirmText: "Ya, Delete",
            cancelText: "Batal",
            onConfirm: async () => {
                closeDialog();

                const { error } = await supabase
                    .from("orders")
                    .delete()
                    .eq("id", order.id);

                if (error) {
                    showDialog({
                        type: "error",
                        title: "Gagal Delete Order",
                        message: error.message,
                    });
                    return;
                }

                fetchData();

                showDialog({
                    type: "success",
                    title: "Order Dihapus",
                    message: `Order #${order.id} berhasil dihapus.`,
                    confirmText: "Mengerti",
                });
            },
        });
    };

    const printOrderReceipt = (order) => {
        const items = order.order_items || [];

        const itemRows = items
            .map((item) => {
                const name = item.product_name || item.products?.name || "Produk";
                const qty = item.quantity ?? item.qty ?? 0;

                return `
          <div class="row">
            <span>${name} x ${qty}</span>
            <strong>${formatRupiah(
                    Number(item.price || 0) * Number(qty || 0)
                )}</strong>
          </div>
        `;
            })
            .join("");

        const html = `
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              padding: 16px;
              color: #111;
            }
            .center { text-align: center; }
            .line { border-top: 1px dashed #111; margin: 10px 0; }
            .row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              margin: 6px 0;
              gap: 10px;
            }
            h2, p { margin: 4px 0; }
            .small { font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>Double You Cake</h2>
            <p>Order Receipt</p>
          </div>

          <div class="line"></div>

          <div class="row"><span>Order</span><strong>#${order.id}</strong></div>
          <div class="row"><span>Customer</span><strong>${order.customer_name || "Customer"}</strong></div>
          <div class="row"><span>Source</span><strong>${order.order_source || "online"}</strong></div>
          <div class="row"><span>Cashier</span><strong>${getCashierName(order.cashier_id)}</strong></div>
          <div class="row"><span>Date</span><strong>${formatDate(order.created_at)}</strong></div>
          <div class="row"><span>Payment</span><strong>${order.payment_method || "-"}</strong></div>
          <div class="row"><span>Status</span><strong>${order.payment_status || "-"}</strong></div>

          <div class="line"></div>
          ${itemRows}
          <div class="line"></div>

          <div class="row"><span>Total</span><strong>${formatRupiah(order.total_price)}</strong></div>

          <div class="line"></div>

          <div class="center">
            <p>Terima kasih</p>
            <p class="small">Double You Cake</p>
          </div>

          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `;

        const win = window.open("", "_blank", "width=400,height=600");

        if (!win) {
            showDialog({
                type: "error",
                title: "Print Gagal",
                message: "Popup print diblokir browser. Izinkan popup untuk website ini.",
            });
            return;
        }

        win.document.write(html);
        win.document.close();
    };

    return (
        <>
            <div>
                <div className="mb-6">
                    <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                        Admin Payment Management
                    </p>

                    <h1 className="text-4xl font-black text-[#4A2C2A] mt-1">
                        Order Payment
                    </h1>

                    <p className="text-sm text-gray-500 font-semibold mt-1">
                        Admin dapat melihat semua order dari seluruh kasir, konfirmasi
                        payment, update status, cancel, print, dan delete order.
                    </p>
                </div>

                <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
                    <div className="mb-5 flex items-center gap-3 bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl px-4 py-3">
                        <Search size={18} className="text-gray-400" />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari order, customer, kasir, status, source, atau produk..."
                            className="w-full bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1350px] text-sm">
                            <thead>
                                <tr className="bg-[#FAFAFA] text-gray-500">
                                    <th className="text-left px-5 py-4 font-black">Order</th>
                                    <th className="text-left px-5 py-4 font-black">Source</th>
                                    <th className="text-left px-5 py-4 font-black">Cashier</th>
                                    <th className="text-left px-5 py-4 font-black">Customer</th>
                                    <th className="text-left px-5 py-4 font-black">Items</th>
                                    <th className="text-left px-5 py-4 font-black">Total</th>
                                    <th className="text-left px-5 py-4 font-black">
                                        Order Status
                                    </th>
                                    <th className="text-left px-5 py-4 font-black">Payment</th>
                                    <th className="text-left px-5 py-4 font-black">Created</th>
                                    <th className="text-right px-5 py-4 font-black">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="px-5 py-10 text-center text-gray-400 font-bold"
                                        >
                                            Tidak ada order.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const isPaid = order.payment_status === "paid";
                                        const isCancelled =
                                            order.payment_status === "cancelled" ||
                                            order.status === "Dibatalkan";

                                        const canPay = !isPaid && !isCancelled;
                                        const canCancel =
                                            !isCancelled && order.status !== "Selesai";

                                        return (
                                            <tr
                                                key={order.id}
                                                className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8]"
                                            >
                                                <td className="px-5 py-4 font-black text-[#4A2C2A]">
                                                    #{order.id}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <SourceBadge source={order.order_source || "online"} />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 font-black text-[#4A2C2A]">
                                                        <UserRound size={16} />
                                                        {getCashierName(order.cashier_id)}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {order.customer_name || "Customer"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-[#4A2C2A]">
                                                        {(order.order_items || []).length} item
                                                    </div>

                                                    <p className="text-xs text-gray-400 line-clamp-1">
                                                        {(order.order_items || [])
                                                            .map((item) => {
                                                                const name =
                                                                    item.product_name ||
                                                                    item.products?.name ||
                                                                    "Produk";
                                                                const qty = item.quantity ?? item.qty ?? 0;
                                                                return `${name} x${qty}`;
                                                            })
                                                            .join(", ") || "-"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 font-black text-[#8A5F41]">
                                                    {formatRupiah(order.total_price)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <PaymentBadge status={order.payment_status} />
                                                </td>

                                                <td className="px-5 py-4 text-xs text-gray-400 font-bold">
                                                    {formatDate(order.created_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        {canPay && (
                                                            <button
                                                                onClick={() =>
                                                                    setPaymentModal({
                                                                        open: true,
                                                                        order,
                                                                    })
                                                                }
                                                                className="px-4 py-2 rounded-xl bg-[#4A2C2A] text-white font-black flex items-center gap-2"
                                                            >
                                                                <CheckCircle2 size={15} />
                                                                Pay
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() =>
                                                                setStatusModal({
                                                                    open: true,
                                                                    order,
                                                                })
                                                            }
                                                            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center gap-2 hover:bg-blue-100"
                                                        >
                                                            <RotateCcw size={15} />
                                                            Update
                                                        </button>

                                                        {canCancel && (
                                                            <button
                                                                onClick={() => cancelOrder(order)}
                                                                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-black flex items-center gap-2 hover:bg-red-100"
                                                            >
                                                                <Ban size={15} />
                                                                Cancel
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => printOrderReceipt(order)}
                                                            className="px-4 py-2 rounded-xl border border-[#E7DED7] font-black flex items-center gap-2"
                                                        >
                                                            <Printer size={15} />
                                                            Print
                                                        </button>

                                                        <button
                                                            onClick={() => deleteOrder(order)}
                                                            className="px-4 py-2 rounded-xl bg-red-600 text-white font-black flex items-center gap-2 hover:bg-red-700"
                                                        >
                                                            <Trash2 size={15} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <PaymentModal
                    open={paymentModal.open}
                    order={paymentModal.order}
                    onClose={() => setPaymentModal({ open: false, order: null })}
                    onSuccess={() => {
                        setPaymentModal({ open: false, order: null });
                        fetchData();

                        showDialog({
                            type: "success",
                            title: "Pembayaran Berhasil",
                            message: "Order berhasil dikonfirmasi sebagai paid.",
                            confirmText: "Mengerti",
                        });
                    }}
                    onError={(message) =>
                        showDialog({
                            type: "error",
                            title: "Gagal Konfirmasi Pembayaran",
                            message,
                        })
                    }
                />

                <StatusModal
                    open={statusModal.open}
                    order={statusModal.order}
                    onClose={() => setStatusModal({ open: false, order: null })}
                    onSubmit={(order, status) => {
                        setStatusModal({ open: false, order: null });
                        updateOrderStatus(order, status);
                    }}
                />
            </div>

            <AppDialog
                open={dialog.open}
                type={dialog.type}
                title={dialog.title}
                message={dialog.message}
                showCancel={dialog.showCancel}
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
                onCancel={closeDialog}
                onConfirm={dialog.onConfirm ? dialog.onConfirm : closeDialog}
            />
        </>
    );
}

function PaymentModal({ open, order, onClose, onSuccess, onError }) {
    const [method, setMethod] = useState("cash");
    const [loading, setLoading] = useState(false);

    if (!open || !order) return null;

    const submit = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("orders")
                .update({
                    payment_status: "paid",
                    payment_method: method,
                    paid_at: new Date().toISOString(),
                    cashier_id: order.cashier_id || user?.id || null,
                    status: "Selesai",
                })
                .eq("id", order.id);

            if (error) throw error;

            onSuccess();
        } catch (error) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">Confirm Payment</h2>
                        <p className="text-sm text-white/70">Order #{order.id}</p>
                    </div>

                    <button onClick={onClose}>
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <OrderItemsBox order={order} />

                    <div>
                        <label className="text-sm font-black text-[#4A2C2A]">
                            Payment Method
                        </label>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <PayButton
                                active={method === "cash"}
                                icon={<Banknote size={17} />}
                                label="Cash"
                                onClick={() => setMethod("cash")}
                            />

                            <PayButton
                                active={method === "qris"}
                                icon={<QrCode size={17} />}
                                label="QRIS"
                                onClick={() => setMethod("qris")}
                            />

                            <PayButton
                                active={method === "transfer"}
                                icon={<CreditCard size={17} />}
                                label="Transfer"
                                onClick={() => setMethod("transfer")}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Confirm Payment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusModal({ open, order, onClose, onSubmit }) {
    const [status, setStatus] = useState("Masuk");

    useEffect(() => {
        if (open && order) {
            setStatus(order.status || "Masuk");
        }
    }, [open, order]);

    if (!open || !order) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">Update Order Status</h2>
                        <p className="text-sm text-white/70">Order #{order.id}</p>
                    </div>

                    <button onClick={onClose}>
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <OrderItemsBox order={order} />

                    <div>
                        <label className="text-sm font-black text-[#4A2C2A]">
                            Status Order
                        </label>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
                        >
                            <option value="Masuk">Masuk</option>
                            <option value="Diproses">Diproses</option>
                            <option value="Open Bill">Open Bill</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={() => onSubmit(order, status)}
                            className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2"
                        >
                            <PackageCheck size={17} />
                            Save Status
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderItemsBox({ order }) {
    return (
        <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3 text-[#4A2C2A] font-black">
                <ReceiptText size={18} />
                Order Detail
            </div>

            {(order.order_items || []).map((item) => {
                const name = item.product_name || item.products?.name || "Produk";
                const qty = item.quantity ?? item.qty ?? 0;

                return (
                    <div
                        key={item.id}
                        className="flex justify-between text-sm font-semibold mb-2"
                    >
                        <span>
                            {name} x {qty}
                        </span>
                        <span>
                            {formatRupiah(Number(item.price || 0) * Number(qty || 0))}
                        </span>
                    </div>
                );
            })}

            <div className="border-t border-[#E7DED7] mt-3 pt-3 flex justify-between font-black">
                <span>Total</span>
                <span>{formatRupiah(order.total_price)}</span>
            </div>
        </div>
    );
}

function PayButton({ active, icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 ${active ? "bg-[#4A2C2A] text-white" : "bg-[#F6F1EC] text-[#4A2C2A]"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function SourceBadge({ source }) {
    const isOffline = source === "offline";

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-black ${isOffline ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                }`}
        >
            {isOffline ? "Offline" : "Online"}
        </span>
    );
}

function StatusBadge({ status }) {
    const config = {
        Masuk: "bg-orange-50 text-orange-700",
        Diproses: "bg-blue-50 text-blue-700",
        "Open Bill": "bg-yellow-50 text-yellow-700",
        Selesai: "bg-green-50 text-green-700",
        Dibatalkan: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-black ${config[status] || "bg-gray-50 text-gray-600"
                }`}
        >
            {status || "Masuk"}
        </span>
    );
}

function PaymentBadge({ status }) {
    const config = {
        pending: "bg-orange-50 text-orange-700",
        paid: "bg-green-50 text-green-700",
        cancelled: "bg-red-50 text-red-700",
        failed: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-black ${config[status] || "bg-orange-50 text-orange-700"
                }`}
        >
            {status || "pending"}
        </span>
    );
}