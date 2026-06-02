import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Printer, LogOut, Wallet } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AppDialog from "../../components/AppDialog";

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

export default function CashierClosing() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const shouldLogout = searchParams.get("logout") === "true";

    const [profile, setProfile] = useState(null);
    const [activeShift, setActiveShift] = useState(null);
    const [orders, setOrders] = useState([]);
    const [cashInDrawer, setCashInDrawer] = useState("");
    const [openingCash, setOpeningCash] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);

    const [dialog, setDialog] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
    });

    const showDialog = ({ type = "info", title, message }) => {
        setDialog({ open: true, type, title, message });
    };

    const closeDialog = () => {
        setDialog((prev) => ({ ...prev, open: false }));
    };

    useEffect(() => {
        initClosing();
    }, []);

    const initClosing = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            setProfile(profileData);

            let { data: shift } = await supabase
                .from("cashier_closings")
                .select("*")
                .eq("cashier_id", user.id)
                .eq("status", "open")
                .order("opened_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!shift) {
                const { data: newShift, error } = await supabase
                    .from("cashier_closings")
                    .insert({
                        cashier_id: user.id,
                        status: "open",
                        opening_cash: 0,
                        opened_at: new Date().toISOString(),
                    })
                    .select("*")
                    .single();

                if (error) throw error;
                shift = newShift;
            }

            setActiveShift(shift);
            setOpeningCash(shift.opening_cash || 0);

            await fetchShiftOrders(user.id, shift.opened_at);
        } catch (error) {
            showDialog({
                type: "error",
                title: "Gagal Memuat Closing",
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchShiftOrders = async (cashierId, openedAt) => {
        const { data, error } = await supabase
            .from("orders")
            .select(
                "id, customer_name, total_price, payment_method, payment_status, paid_at, created_at, cashier_id"
            )
            .eq("cashier_id", cashierId)
            .eq("payment_status", "paid")
            .gte("paid_at", openedAt)
            .order("paid_at", { ascending: false });

        if (error) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Order Shift",
                message: error.message,
            });
            return;
        }

        setOrders(data || []);
    };

    const summary = useMemo(() => {
        const cash = orders
            .filter((o) => o.payment_method === "cash")
            .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

        const qris = orders
            .filter((o) => o.payment_method === "qris")
            .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

        const transfer = orders
            .filter((o) => o.payment_method === "transfer")
            .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

        const total = cash + qris + transfer;
        const expectedCash = Number(openingCash || 0) + cash;
        const difference = Number(cashInDrawer || 0) - expectedCash;

        return {
            cash,
            qris,
            transfer,
            total,
            totalOrders: orders.length,
            expectedCash,
            difference,
        };
    }, [orders, cashInDrawer, openingCash]);

    const printClosingReceipt = (closingData = activeShift) => {
        const orderRows = orders
            .map(
                (order) => `
          <div class="row">
            <span>#${order.id}</span>
            <strong>${formatRupiah(order.total_price)}</strong>
          </div>
        `
            )
            .join("");

        const html = `
      <html>
        <head>
          <title>Closing Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              width: 320px;
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
            }
            h2, p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>Double You Cake</h2>
            <p>Closing Shift Receipt</p>
          </div>

          <div class="line"></div>

          <div class="row">
            <span>Closing ID</span>
            <strong>#${closingData?.id || "-"}</strong>
          </div>

          <div class="row">
            <span>Cashier</span>
            <strong>${profile?.full_name || profile?.email || "Cashier"}</strong>
          </div>

          <div class="row">
            <span>Open</span>
            <strong>${formatDate(activeShift?.opened_at)}</strong>
          </div>

          <div class="row">
            <span>Close</span>
            <strong>${formatDate(new Date())}</strong>
          </div>

          <div class="line"></div>

          <div class="row">
            <span>Total Orders</span>
            <strong>${summary.totalOrders}</strong>
          </div>

          <div class="row">
            <span>Cash Sales</span>
            <strong>${formatRupiah(summary.cash)}</strong>
          </div>

          <div class="row">
            <span>QRIS Sales</span>
            <strong>${formatRupiah(summary.qris)}</strong>
          </div>

          <div class="row">
            <span>Transfer Sales</span>
            <strong>${formatRupiah(summary.transfer)}</strong>
          </div>

          <div class="row">
            <span>Total Sales</span>
            <strong>${formatRupiah(summary.total)}</strong>
          </div>

          <div class="line"></div>

          <div class="row">
            <span>Opening Cash</span>
            <strong>${formatRupiah(openingCash)}</strong>
          </div>

          <div class="row">
            <span>Expected Cash</span>
            <strong>${formatRupiah(summary.expectedCash)}</strong>
          </div>

          <div class="row">
            <span>Cash Drawer</span>
            <strong>${formatRupiah(cashInDrawer)}</strong>
          </div>

          <div class="row">
            <span>Difference</span>
            <strong>${formatRupiah(summary.difference)}</strong>
          </div>

          <div class="line"></div>

          <p><strong>Orders:</strong></p>
          ${orderRows || "<p>No orders</p>"}

          <div class="line"></div>

          <div class="center">
            <p>Closing completed</p>
          </div>

          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `;

        const win = window.open("", "_blank", "width=420,height=700");

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

    const closeShift = async () => {
        if (!activeShift) return;

        if (cashInDrawer === "") {
            showDialog({
                type: "warning",
                title: "Cash Drawer Kosong",
                message: "Isi jumlah cash in drawer terlebih dahulu sebelum closing shift.",
            });
            return;
        }

        try {
            setClosing(true);

            const { error: updateError } = await supabase
                .from("cashier_closings")
                .update({
                    opening_cash: Number(openingCash || 0),
                    cash_sales: summary.cash,
                    qris_sales: summary.qris,
                    transfer_sales: summary.transfer,
                    total_sales: summary.total,
                    total_orders: summary.totalOrders,
                    cash_in_drawer: Number(cashInDrawer || 0),
                    difference: summary.difference,
                    note,
                    status: "closed",
                    closed_at: new Date().toISOString(),
                })
                .eq("id", activeShift.id);

            if (updateError) throw updateError;

            if (orders.length > 0) {
                const payload = orders.map((order) => ({
                    closing_id: activeShift.id,
                    order_id: order.id,
                    order_total: Number(order.total_price || 0),
                    payment_method: order.payment_method,
                }));

                const { error: insertError } = await supabase
                    .from("cashier_closing_orders")
                    .insert(payload);

                if (insertError) throw insertError;
            }

            printClosingReceipt(activeShift);

            await supabase.auth.signOut();
            navigate("/login");

        } catch (error) {
            showDialog({
                type: "error",
                title: "Gagal Closing Shift",
                message: error.message,
            });
        } finally {
            setClosing(false);
        }
    };

    if (loading) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="font-bold text-gray-400">
                        Loading closing shift...
                    </p>
                </div>

                <AppDialog
                    open={dialog.open}
                    type={dialog.type}
                    title={dialog.title}
                    message={dialog.message}
                    confirmText="Mengerti"
                    onConfirm={closeDialog}
                    onCancel={closeDialog}
                />
            </>
        );
    }

    return (
        <>
            <div>
                <div className="mb-6">
                    <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                        Shift Closing
                    </p>

                    <h1 className="text-4xl font-black text-[#4A2C2A] mt-1">
                        Closing Shift
                    </h1>

                    <p className="text-sm text-gray-500 font-semibold mt-1">
                        Rekap transaksi kasir dan cetak struk closing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card title="Total Orders" value={summary.totalOrders} />
                    <Card title="Total Sales" value={formatRupiah(summary.total)} />
                    <Card title="Cash Sales" value={formatRupiah(summary.cash)} />
                    <Card
                        title="Expected Cash"
                        value={formatRupiah(summary.expectedCash)}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white border border-[#E7DED7] rounded-[2rem] p-5">
                        <h2 className="text-xl font-black text-[#4A2C2A] mb-4">
                            Orders in This Shift
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-sm">
                                <thead>
                                    <tr className="bg-[#FAFAFA] text-gray-500">
                                        <th className="text-left px-5 py-4 font-black">Order</th>
                                        <th className="text-left px-5 py-4 font-black">
                                            Customer
                                        </th>
                                        <th className="text-left px-5 py-4 font-black">
                                            Payment
                                        </th>
                                        <th className="text-left px-5 py-4 font-black">Total</th>
                                        <th className="text-left px-5 py-4 font-black">
                                            Paid At
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-10 text-center text-gray-400 font-bold"
                                            >
                                                Belum ada transaksi paid pada shift ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-t border-[#F3F3F3]"
                                            >
                                                <td className="px-5 py-4 font-black">
                                                    #{order.id}
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {order.customer_name || "Customer"}
                                                </td>

                                                <td className="px-5 py-4 font-semibold uppercase">
                                                    {order.payment_method}
                                                </td>

                                                <td className="px-5 py-4 font-black text-[#8A5F41]">
                                                    {formatRupiah(order.total_price)}
                                                </td>

                                                <td className="px-5 py-4 text-xs text-gray-400 font-bold">
                                                    {formatDate(order.paid_at || order.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 h-fit">
                        <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center mb-4">
                            <Wallet size={22} />
                        </div>

                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Closing Form
                        </h2>

                        <div className="space-y-4 mt-5">
                            <Input
                                label="Opening Cash"
                                type="number"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                            />

                            <Input
                                label="Cash in Drawer"
                                type="number"
                                value={cashInDrawer}
                                onChange={(e) => setCashInDrawer(e.target.value)}
                            />

                            <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-4 space-y-2">
                                <Row label="Cash Sales" value={formatRupiah(summary.cash)} />
                                <Row label="QRIS Sales" value={formatRupiah(summary.qris)} />
                                <Row
                                    label="Transfer Sales"
                                    value={formatRupiah(summary.transfer)}
                                />
                                <Row
                                    label="Difference"
                                    value={formatRupiah(summary.difference)}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-black text-[#4A2C2A]">
                                    Note
                                </label>

                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
                                    rows={3}
                                />
                            </div>

                            <button
                                onClick={printClosingReceipt}
                                className="w-full px-5 py-3 rounded-2xl border border-[#E7DED7] font-black flex items-center justify-center gap-2"
                            >
                                <Printer size={17} />
                                Preview / Print
                            </button>

                            <button
                                onClick={closeShift}
                                disabled={closing}
                                className="w-full px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {shouldLogout ? <LogOut size={17} /> : <Printer size={17} />}
                                {closing
                                    ? "Processing..."
                                    : shouldLogout
                                        ? "Close Shift & Logout"
                                        : "Close Shift"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AppDialog
                open={dialog.open}
                type={dialog.type}
                title={dialog.title}
                message={dialog.message}
                confirmText="Mengerti"
                onConfirm={closeDialog}
                onCancel={closeDialog}
            />
        </>
    );
}

function Card({ title, value }) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 shadow-sm">
            <p className="text-sm text-gray-400 font-bold">{title}</p>
            <h2 className="text-xl font-black text-[#4A2C2A] mt-1">
                {value}
            </h2>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div>
            <label className="text-sm font-black text-[#4A2C2A]">
                {label}
            </label>

            <input
                {...props}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
            />
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-500">{label}</span>
            <span className="text-[#4A2C2A]">{value}</span>
        </div>
    );
}