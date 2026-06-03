import { useEffect, useState } from "react";
import { ReceiptText, Wallet, CreditCard, QrCode } from "lucide-react";
import { supabase } from "../../lib/supabase";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function CashierDashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSales: 0,
        cash: 0,
        qris: 0,
        transfer: 0,
    });

    useEffect(() => {
        fetchStats();

        const channel = supabase
            .channel("cashier-dashboard")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                fetchStats
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStats = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from("orders")
            .select("id, total_price, payment_method, payment_status, created_at")
            .eq("payment_status", "paid")
            .gte("created_at", today.toISOString());

        const orders = data || [];

        setStats({
            totalOrders: orders.length,
            totalSales: orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0),
            cash: orders
                .filter((o) => o.payment_method === "cash")
                .reduce((sum, o) => sum + Number(o.total_price || 0), 0),
            qris: orders
                .filter((o) => o.payment_method === "qris")
                .reduce((sum, o) => sum + Number(o.total_price || 0), 0),
            transfer: orders
                .filter((o) => o.payment_method === "transfer")
                .reduce((sum, o) => sum + Number(o.total_price || 0), 0),
        });
    };

    return (
        <div className="w-full">
            <div className="mb-5 sm:mb-6">
                <p className="text-[10px] sm:text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                    Cashier Overview
                </p>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#4A2C2A] mt-1">
                    Cashier Dashboard
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">
                    Ringkasan transaksi kasir hari ini.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
                <Card title="Orders Paid" value={stats.totalOrders} icon={<ReceiptText size={22} />} />
                <Card title="Total Sales" value={formatRupiah(stats.totalSales)} icon={<Wallet size={22} />} />
                <Card title="Cash" value={formatRupiah(stats.cash)} icon={<Wallet size={22} />} />
                <Card title="QRIS" value={formatRupiah(stats.qris)} icon={<QrCode size={22} />} />
                <Card title="Transfer" value={formatRupiah(stats.transfer)} icon={<CreditCard size={22} />} />
            </div>
        </div>
    );
}

function Card({ title, value, icon }) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 font-bold">
                        {title}
                    </p>

                    <h2 className="text-base sm:text-lg lg:text-xl font-black text-[#4A2C2A] mt-1 break-words">
                        {value}
                    </h2>
                </div>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center shrink-0">
                    {icon}
                </div>
            </div>
        </div>
    );
}