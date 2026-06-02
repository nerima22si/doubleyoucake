import { useEffect, useState } from "react";
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
} from "lucide-react";

import AppDialog from "../../components/AppDialog";
import { supabase } from "../../lib/supabase";

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

export default function CashierOrders() {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [paymentModal, setPaymentModal] = useState({ open: false, order: null });

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
        setDialog((prev) => ({ ...prev, open: false }));
    };

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel("cashier-open-bills")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                fetchOrders
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select(`
        id,
        customer_name,
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
          quantity
        )
      `)
            .eq("order_source", "offline")
            .order("created_at", { ascending: false });

        if (error) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Open Bill",
                message: error.message,
            });
            return;
        }

        setOrders(data || []);
    };

    const cancelOpenBill = async (order) => {
        if (order.status !== "Open Bill" || order.payment_status !== "pending") {
            showDialog({
                type: "warning",
                title: "Tidak Bisa Cancel",
                message: "Kasir hanya bisa cancel order yang masih Open Bill dan pending.",
            });
            return;
        }

        showDialog({
            type: "warning",
            title: "Cancel Open Bill?",
            message: `Yakin ingin membatalkan open bill #${order.id}?`,
            showCancel: true,
            confirmText: "Ya, Cancel",
            cancelText: "Tidak",
            onConfirm: async () => {
                closeDialog();

                const { error } = await supabase
                    .from("orders")
                    .update({
                        status: "Dibatalkan",
                        payment_status: "cancelled",
                    })
                    .eq("id", order.id);

                if (error) {
                    showDialog({
                        type: "error",
                        title: "Gagal Cancel",
                        message: error.message,
                    });
                    return;
                }

                fetchOrders();

                showDialog({
                    type: "success",
                    title: "Open Bill Dibatalkan",
                    message: `Open bill #${order.id} berhasil dibatalkan.`,
                    confirmText: "Mengerti",
                });
            },
        });
    };

    const filteredOrders = orders.filter((order) => {
        const q = search.toLowerCase();

        return (
            String(order.id).toLowerCase().includes(q) ||
            (order.customer_name || "").toLowerCase().includes(q) ||
            (order.status || "").toLowerCase().includes(q) ||
            (order.payment_status || "").toLowerCase().includes(q)
        );
    });

    const printOrderReceipt = (order) => {
        const items = order.order_items || [];

        const itemRows = items
            .map(
                (item) => `
        <div class="row">
          <span>${item.product_name || "Produk"} x ${item.quantity}</span>
          <strong>${formatRupiah(
                    Number(item.price || 0) * Number(item.quantity || 0)
                )}</strong>
        </div>
      `
            )
            .join("");

        const html = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 0 auto; padding: 16px; color: #111; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #111; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; font-size: 13px; margin: 6px 0; gap: 10px; }
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
          <div class="row"><span>Customer</span><strong>${order.customer_name || "Walk In Customer"}</strong></div>
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
                        Cashier Open Bill
                    </p>

                    <h1 className="text-4xl font-black text-[#4A2C2A] mt-1">
                        Cashier Orders
                    </h1>

                    <p className="text-sm text-gray-500 font-semibold mt-1">
                        Kasir hanya bisa konfirmasi pembayaran dan cancel Open Bill.
                    </p>
                </div>

                <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
                    <div className="mb-5 flex items-center gap-3 bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl px-4 py-3">
                        <Search size={18} className="text-gray-400" />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari open bill, customer, atau status..."
                            className="w-full bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead>
                                <tr className="bg-[#FAFAFA] text-gray-500">
                                    <th className="text-left px-5 py-4 font-black">Order</th>
                                    <th className="text-left px-5 py-4 font-black">Customer</th>
                                    <th className="text-left px-5 py-4 font-black">Items</th>
                                    <th className="text-left px-5 py-4 font-black">Total</th>
                                    <th className="text-left px-5 py-4 font-black">Status</th>
                                    <th className="text-left px-5 py-4 font-black">Payment</th>
                                    <th className="text-left px-5 py-4 font-black">Created</th>
                                    <th className="text-right px-5 py-4 font-black">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-5 py-10 text-center text-gray-400 font-bold"
                                        >
                                            Tidak ada open bill.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const canAction =
                                            order.status === "Open Bill" &&
                                            order.payment_status === "pending";

                                        return (
                                            <tr
                                                key={order.id}
                                                className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8]"
                                            >
                                                <td className="px-5 py-4 font-black text-[#4A2C2A]">
                                                    #{order.id}
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {order.customer_name || "Walk In Customer"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-[#4A2C2A]">
                                                        {(order.order_items || []).length} item
                                                    </div>
                                                    <p className="text-xs text-gray-400 line-clamp-1">
                                                        {(order.order_items || [])
                                                            .map((item) => `${item.product_name} x${item.quantity}`)
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
                                                    <div className="flex justify-end gap-2">
                                                        {canAction && (
                                                            <>
                                                                <button
                                                                    onClick={() => cancelOpenBill(order)}
                                                                    className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-black flex items-center gap-2 hover:bg-red-100"
                                                                >
                                                                    <Ban size={15} />
                                                                    Cancel
                                                                </button>

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
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={() => printOrderReceipt(order)}
                                                            className="px-4 py-2 rounded-xl border border-[#E7DED7] font-black flex items-center gap-2"
                                                        >
                                                            <Printer size={15} />
                                                            Print
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
                        fetchOrders();

                        showDialog({
                            type: "success",
                            title: "Pembayaran Berhasil",
                            message: "Open bill berhasil dikonfirmasi sebagai paid.",
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

function StatusBadge({ status }) {
    const config = {
        "Open Bill": "bg-orange-50 text-orange-700",
        Selesai: "bg-green-50 text-green-700",
        Dibatalkan: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-black ${config[status] || "bg-gray-50 text-gray-600"
                }`}
        >
            {status || "Open Bill"}
        </span>
    );
}

function PaymentBadge({ status }) {
    const config = {
        pending: "bg-orange-50 text-orange-700",
        paid: "bg-green-50 text-green-700",
        cancelled: "bg-red-50 text-red-700",
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
                    cashier_id: user?.id || null,
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
                    <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3 text-[#4A2C2A] font-black">
                            <ReceiptText size={18} />
                            Open Bill Detail
                        </div>

                        {(order.order_items || []).map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between text-sm font-semibold mb-2"
                            >
                                <span>
                                    {item.product_name} x {item.quantity}
                                </span>
                                <span>
                                    {formatRupiah(Number(item.price || 0) * Number(item.quantity || 0))}
                                </span>
                            </div>
                        ))}

                        <div className="border-t border-[#E7DED7] mt-3 pt-3 flex justify-between font-black">
                            <span>Total</span>
                            <span>{formatRupiah(order.total_price)}</span>
                        </div>
                    </div>

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