import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  X,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart2,
  DollarSign,
  Package,
  Zap,
  AlertTriangle,
  RefreshCcw,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import AppDialog from "../../../components/AppDialog";

const rp = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

const today = () => new Date().toISOString().slice(0, 10);

const months = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const expenseCategories = [
  "Bahan Baku",
  "Perlengkapan",
  "Operasional",
  "Gaji",
  "Marketing",
  "Lainnya",
];

const categoryConfig = {
  "Bahan Baku": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    bar: "bg-orange-500",
    icon: <Package size={14} />,
  },
  Perlengkapan: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    bar: "bg-blue-500",
    icon: <Zap size={14} />,
  },
  Operasional: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    bar: "bg-purple-500",
    icon: <BarChart2 size={14} />,
  },
  Gaji: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    bar: "bg-pink-500",
    icon: <Wallet size={14} />,
  },
  Marketing: {
    bg: "bg-green-50",
    text: "text-green-700",
    bar: "bg-green-500",
    icon: <TrendingUp size={14} />,
  },
  Lainnya: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    bar: "bg-gray-500",
    icon: <FileText size={14} />,
  },
};

const percentChange = (current, previous) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export default function FinanceManagement() {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab] = useState("ringkasan");
  const [reportTab, setReportTab] = useState("bulanan");
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

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
    fetchFinance();

    const channel = supabase
      .channel("finance-management-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchFinance(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "finance_expenses" },
        () => fetchFinance(false)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchFinance = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [ordersRes, expensesRes] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id,total_price,status,payment_status,payment_method,order_source,created_at,paid_at"
          )
          .eq("payment_status", "paid")
          .order("paid_at", { ascending: false }),

        supabase
          .from("finance_expenses")
          .select("*")
          .order("date", { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setOrders(ordersRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      showDialog({
        type: "error",
        title: "Gagal Memuat Finance",
        message: error.message,
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const income = useMemo(() => {
    return orders.map((order) => ({
      id: order.id,
      date: (order.paid_at || order.created_at || "").slice(0, 10),
      description: `Order #${order.id} - ${order.order_source || "online"}`,
      amount: Number(order.total_price || 0),
      source: order.order_source || "online",
      payment_method: order.payment_method || "-",
    }));
  }, [orders]);

  const analytics = useMemo(() => {
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const profit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

    const monthIncome = income
      .filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const monthExpense = expenses
      .filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const prevMonth = filterMonth === 0 ? 11 : filterMonth - 1;
    const prevYear = filterMonth === 0 ? filterYear - 1 : filterYear;

    const prevIncome = income
      .filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);

    const prevExpense = expenses
      .filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalIncome,
      totalExpense,
      profit,
      margin,
      monthIncome,
      monthExpense,
      monthProfit: monthIncome - monthExpense,
      incomeTrend: percentChange(monthIncome, prevIncome),
      expenseTrend: percentChange(monthExpense, prevExpense),
      profitTrend: percentChange(
        monthIncome - monthExpense,
        prevIncome - prevExpense
      ),
      expenseRatio:
        monthIncome > 0 ? Math.round((monthExpense / monthIncome) * 100) : 0,
    };
  }, [income, expenses, filterMonth, filterYear]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = (filterMonth - 5 + i + 12) % 12;
      const year = filterMonth - 5 + i < 0 ? filterYear - 1 : filterYear;

      const masuk = income
        .filter((item) => {
          const d = new Date(item.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, item) => sum + item.amount, 0);

      const keluar = expenses
        .filter((item) => {
          const d = new Date(item.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        label: months[month],
        masuk,
        keluar,
        laba: masuk - keluar,
      };
    });
  }, [income, expenses, filterMonth, filterYear]);

  const expenseByCategory = useMemo(() => {
    const map = {};

    expenses.forEach((item) => {
      const category = item.category || "Lainnya";
      map[category] = (map[category] || 0) + Number(item.amount || 0);
    });

    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const paymentSummary = useMemo(() => {
    const map = {};

    income.forEach((item) => {
      const method = item.payment_method || "-";
      map[method] = (map[method] || 0) + item.amount;
    });

    return Object.entries(map)
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);
  }, [income]);

  const dailyReport = useMemo(() => {
    const dates = [...new Set([...income, ...expenses].map((x) => x.date))]
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));

    return dates.map((date) => {
      const masuk = income
        .filter((i) => i.date === date)
        .reduce((sum, i) => sum + i.amount, 0);

      const keluar = expenses
        .filter((e) => e.date === date)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        date,
        masuk,
        keluar,
        laba: masuk - keluar,
      };
    });
  }, [income, expenses]);

  const monthlyReport = useMemo(() => {
    return months
      .map((month, index) => {
        const masuk = income
          .filter((item) => {
            const d = new Date(item.date);
            return d.getMonth() === index && d.getFullYear() === filterYear;
          })
          .reduce((sum, item) => sum + item.amount, 0);

        const keluar = expenses
          .filter((item) => {
            const d = new Date(item.date);
            return d.getMonth() === index && d.getFullYear() === filterYear;
          })
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return {
          month,
          masuk,
          keluar,
          laba: masuk - keluar,
          margin: masuk > 0 ? Math.round(((masuk - keluar) / masuk) * 100) : 0,
        };
      })
      .filter((item) => item.masuk > 0 || item.keluar > 0);
  }, [income, expenses, filterYear]);

  const yearlyReport = useMemo(() => {
    const years = [
      ...new Set(
        [...income, ...expenses]
          .map((item) => new Date(item.date).getFullYear())
          .filter(Boolean)
      ),
    ].sort((a, b) => b - a);

    return years.map((year) => {
      const masuk = income
        .filter((item) => new Date(item.date).getFullYear() === year)
        .reduce((sum, item) => sum + item.amount, 0);

      const keluar = expenses
        .filter((item) => new Date(item.date).getFullYear() === year)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        year,
        masuk,
        keluar,
        laba: masuk - keluar,
        margin: masuk > 0 ? Math.round(((masuk - keluar) / masuk) * 100) : 0,
      };
    });
  }, [income, expenses]);

  const saveExpense = async (payload) => {
    const { error } = await supabase.from("finance_expenses").insert(payload);

    if (error) {
      showDialog({
        type: "error",
        title: "Gagal Menyimpan",
        message: error.message,
      });
      return;
    }

    setModal(false);
    fetchFinance(false);

    showDialog({
      type: "success",
      title: "Pengeluaran Disimpan",
      message: "Data pengeluaran berhasil ditambahkan.",
      confirmText: "Mengerti",
    });
  };

  const deleteExpense = async (item) => {
    showDialog({
      type: "warning",
      title: "Hapus Pengeluaran?",
      message: `Yakin ingin menghapus pengeluaran "${item.description}"?`,
      showCancel: true,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        closeDialog();

        const { error } = await supabase
          .from("finance_expenses")
          .delete()
          .eq("id", item.id);

        if (error) {
          showDialog({
            type: "error",
            title: "Gagal Hapus",
            message: error.message,
          });
          return;
        }

        fetchFinance(false);

        showDialog({
          type: "success",
          title: "Berhasil Dihapus",
          message: "Data pengeluaran berhasil dihapus.",
          confirmText: "Mengerti",
        });
      },
    });
  };

  const financeInsight =
    analytics.profit > 0
      ? `Keuangan sehat. Bisnis untung ${rp(
        analytics.profit
      )} dengan margin ${analytics.margin}%.`
      : `Perhatian. Pengeluaran lebih besar dari pemasukan sebesar ${rp(
        Math.abs(analytics.profit)
      )}.`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="font-black text-gray-400">Loading finance...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen  p-6 text-[#4A2C2A]">
        <div className="max-w mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                Finance Management
              </p>

              <h1 className="text-4xl font-black mt-1">
                Manajemen Keuangan
              </h1>

              <p className="text-sm text-gray-500 font-semibold mt-1">
                Pantau pemasukan order paid, pengeluaran, laba, margin, dan laporan bisnis.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchFinance}
                className="px-5 py-3 rounded-2xl border border-[#E7DED7] bg-white font-black flex items-center gap-2"
              >
                <RefreshCcw size={17} />
                Refresh
              </button>

              <button
                onClick={() => setModal(true)}
                className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2"
              >
                <Plus size={17} />
                Tambah Pengeluaran
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Pemasukan"
              value={rp(analytics.totalIncome)}
              trend={analytics.incomeTrend}
              color="green"
              icon={<TrendingUp size={22} />}
              sub="Dari order paid"
            />

            <StatCard
              title="Total Pengeluaran"
              value={rp(analytics.totalExpense)}
              trend={analytics.expenseTrend}
              color="red"
              icon={<TrendingDown size={22} />}
              sub="Biaya operasional"
            />

            <StatCard
              title="Keuntungan Bersih"
              value={rp(analytics.profit)}
              trend={analytics.profitTrend}
              color={analytics.profit >= 0 ? "orange" : "red"}
              icon={<Wallet size={22} />}
              sub="Income - expense"
            />

            <StatCard
              title="Margin Profit"
              value={`${analytics.margin}%`}
              color={
                analytics.margin >= 30
                  ? "green"
                  : analytics.margin >= 10
                    ? "orange"
                    : "red"
              }
              icon={<DollarSign size={22} />}
              sub={`Expense ratio ${analytics.expenseRatio}%`}
            />
          </div>

          <div
            className={`mb-6 border rounded-[2rem] p-5 ${analytics.profit >= 0
                ? "bg-green-50 border-green-100 text-green-800"
                : "bg-red-50 border-red-100 text-red-800"
              }`}
          >
            <div className="flex items-start gap-3">
              {analytics.profit >= 0 ? (
                <CheckCircle size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}

              <div>
                <h2 className="font-black">Insight Keuangan</h2>
                <p className="text-sm font-semibold mt-1">
                  {financeInsight}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7DED7] rounded-[2rem] overflow-hidden">
            <div className="border-b border-[#E7DED7] flex overflow-x-auto px-2">
              {[
                { id: "ringkasan", label: "Ringkasan", icon: <BarChart2 size={14} /> },
                { id: "pemasukan", label: "Pemasukan", icon: <ArrowUpRight size={14} /> },
                { id: "pengeluaran", label: "Pengeluaran", icon: <ArrowDownRight size={14} /> },
                { id: "laporan", label: "Laporan", icon: <FileText size={14} /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`px-5 py-4 text-sm font-black flex items-center gap-2 border-b-2 ${tab === item.id
                      ? "border-[#8A5F41] text-[#8A5F41]"
                      : "border-transparent text-gray-400"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "ringkasan" && (
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black">
                      Grafik Arus Kas 6 Bulan
                    </h2>
                    <p className="text-sm text-gray-400 font-semibold">
                      Perbandingan pemasukan, pengeluaran, dan laba.
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(Number(e.target.value))}
                      className="px-4 py-2 rounded-2xl border border-[#E7DED7] font-bold outline-none"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>

                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => setFilterMonth(index)}
                        className={`px-4 py-2 rounded-full text-xs font-black ${filterMonth === index
                            ? "bg-[#4A2C2A] text-white"
                            : "bg-[#F6F1EC] text-[#4A2C2A]"
                          }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <CashFlowChart data={chartData} />
                  </div>

                  <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-[2rem] p-5">
                    <h2 className="text-xl font-black mb-4">
                      Bulan {months[filterMonth]} {filterYear}
                    </h2>

                    <SummaryRow label="Pemasukan" value={rp(analytics.monthIncome)} color="text-green-600" />
                    <SummaryRow label="Pengeluaran" value={rp(analytics.monthExpense)} color="text-red-600" />
                    <SummaryRow
                      label="Laba/Rugi"
                      value={rp(analytics.monthProfit)}
                      color={analytics.monthProfit >= 0 ? "text-orange-600" : "text-red-600"}
                    />

                    <div className="mt-5 text-sm font-bold text-gray-500">
                      {analytics.monthProfit >= 0
                        ? "Kondisi bulan ini aman karena pemasukan lebih besar dari pengeluaran."
                        : "Pengeluaran bulan ini melebihi pemasukan. Evaluasi biaya operasional."}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <CategoryBreakdown data={expenseByCategory} />
                  <PaymentBreakdown data={paymentSummary} />
                </div>
              </div>
            )}

            {tab === "pemasukan" && (
              <TransactionList title="Daftar Pemasukan" data={income} />
            )}

            {tab === "pengeluaran" && (
              <ExpenseList data={expenses} onDelete={deleteExpense} />
            )}

            {tab === "laporan" && (
              <div className="p-6">
                <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-[2rem] overflow-hidden">
                  <div className="px-5 pt-5">
                    <h2 className="text-xl font-black text-[#4A2C2A]">
                      Laporan Keuangan
                    </h2>

                    <p className="text-sm text-gray-400 font-semibold mt-1">
                      Pilih jenis laporan berdasarkan periode harian, bulanan, atau tahunan.
                    </p>
                  </div>

                  <div className="mt-5 border-b border-[#E7DED7] flex overflow-x-auto px-5">
                    {[
                      {
                        id: "harian",
                        label: "Harian",
                        desc: "Laporan per tanggal",
                        icon: <CalendarDays size={15} />,
                      },
                      {
                        id: "bulanan",
                        label: "Bulanan",
                        desc: "Laporan per bulan",
                        icon: <BarChart2 size={15} />,
                      },
                      {
                        id: "tahunan",
                        label: "Tahunan",
                        desc: "Laporan per tahun",
                        icon: <FileText size={15} />,
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setReportTab(item.id)}
                        className={`px-5 py-4 border-b-4 transition-all text-left min-w-[160px] ${reportTab === item.id
                            ? "border-[#4A2C2A] text-[#4A2C2A]"
                            : "border-transparent text-gray-400 hover:text-[#8A5F41]"
                          }`}
                      >
                        <div className="flex items-center gap-2 font-black text-sm">
                          {item.icon}
                          {item.label}
                        </div>

                        <p className="text-xs font-semibold mt-1">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {reportTab === "harian" && (
                      <div>
                        <ReportHeader
                          title="Laporan Harian"
                          desc="Rekap pemasukan, pengeluaran, laba/rugi, margin, dan kondisi keuangan per tanggal."
                        />
                        <ReportTable type="daily" data={dailyReport} />
                      </div>
                    )}

                    {reportTab === "bulanan" && (
                      <div>
                        <ReportHeader
                          title="Laporan Bulanan"
                          desc="Rekap pemasukan, pengeluaran, laba/rugi, margin, dan kondisi keuangan per bulan."
                        />
                        <ReportTable type="monthly" data={monthlyReport} />
                      </div>
                    )}

                    {reportTab === "tahunan" && (
                      <div>
                        <ReportHeader
                          title="Laporan Tahunan"
                          desc="Rekap pemasukan, pengeluaran, laba/rugi, margin, dan kondisi keuangan per tahun."
                        />
                        <ReportTable type="yearly" data={yearlyReport} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <ExpenseModal onClose={() => setModal(false)} onSave={saveExpense} />
      )}

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

function ReportHeader({ title, desc }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-black text-[#4A2C2A]">{title}</h3>
      <p className="text-sm text-gray-400 font-semibold">{desc}</p>
    </div>
  );
}

function StatCard({ title, value, trend, color, icon, sub }) {
  const cfg = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    orange: "bg-orange-50 text-orange-700",
  }[color];

  const isUp = Number(trend || 0) >= 0;

  return (
    <div className={`border border-[#E7DED7] rounded-[2rem] p-5 ${cfg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold opacity-70">{title}</p>
          <h2 className="text-2xl font-black mt-1">{value}</h2>

          {typeof trend !== "undefined" && (
            <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-black mt-3">
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(Number(trend || 0))}%
            </span>
          )}

          {sub && <p className="text-xs font-bold opacity-70 mt-2">{sub}</p>}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CashFlowChart({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.masuk, d.keluar]), 1);

  return (
    <div className="h-72 flex items-end gap-4">
      {data.map((item) => {
        const inHeight = Math.max((item.masuk / max) * 100, 4);
        const outHeight = Math.max((item.keluar / max) * 100, 4);

        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full h-56 flex items-end justify-center gap-2 bg-[#FAFAFA] rounded-2xl p-3">
              <div
                className="w-5 bg-green-500 rounded-t-xl"
                style={{ height: `${inHeight}%` }}
                title={rp(item.masuk)}
              />
              <div
                className="w-5 bg-red-500 rounded-t-xl"
                style={{ height: `${outHeight}%` }}
                title={rp(item.keluar)}
              />
            </div>

            <span className="text-xs font-black text-gray-400">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <div className="flex justify-between py-3 border-b border-[#E7DED7]">
      <span className="font-bold text-gray-500">{label}</span>
      <span className={`font-black ${color}`}>{value}</span>
    </div>
  );
}

function TransactionList({ title, data }) {
  return (
    <div>
      <div className="px-6 py-4 border-b border-[#E7DED7]">
        <h2 className="text-xl font-black">{title}</h2>
      </div>

      {data.length === 0 ? (
        <p className="p-8 text-center text-gray-400 font-bold">
          Belum ada data.
        </p>
      ) : (
        data.map((item) => (
          <div
            key={item.id}
            className="px-6 py-4 border-b border-[#F3F3F3] flex justify-between gap-4"
          >
            <div>
              <p className="font-black">{item.description}</p>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {item.date} • {item.payment_method} • {item.source}
              </p>
            </div>

            <p className="font-black text-green-600">
              +{rp(item.amount)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function ExpenseList({ data, onDelete }) {
  return (
    <div>
      <div className="px-6 py-4 border-b border-[#E7DED7]">
        <h2 className="text-xl font-black">Daftar Pengeluaran</h2>
      </div>

      {data.length === 0 ? (
        <p className="p-8 text-center text-gray-400 font-bold">
          Belum ada pengeluaran.
        </p>
      ) : (
        data.map((item) => {
          const cfg = categoryConfig[item.category] || categoryConfig.Lainnya;

          return (
            <div
              key={item.id}
              className="px-6 py-4 border-b border-[#F3F3F3] flex justify-between gap-4"
            >
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-2xl ${cfg.bg} ${cfg.text} flex items-center justify-center`}>
                  {cfg.icon}
                </div>

                <div>
                  <p className="font-black">{item.description}</p>
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    {item.date} • {item.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="font-black text-red-600">
                  -{rp(item.amount)}
                </p>

                <button
                  onClick={() => onDelete(item)}
                  className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ReportTable({ type, data }) {
  const labelKey =
    type === "daily" ? "date" : type === "monthly" ? "month" : "year";

  return (
    <div className="overflow-x-auto border border-[#E7DED7] rounded-[2rem]">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="bg-[#FAFAFA] text-gray-500">
            <th className="text-left px-5 py-4 font-black">
              {type === "daily" ? "Tanggal" : type === "monthly" ? "Bulan" : "Tahun"}
            </th>
            <th className="text-left px-5 py-4 font-black">Pemasukan</th>
            <th className="text-left px-5 py-4 font-black">Pengeluaran</th>
            <th className="text-left px-5 py-4 font-black">Laba/Rugi</th>
            <th className="text-left px-5 py-4 font-black">Margin</th>
            <th className="text-left px-5 py-4 font-black">Kondisi</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-5 py-10 text-center text-gray-400 font-bold">
                Belum ada laporan.
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const margin =
                item.masuk > 0
                  ? Math.round((item.laba / item.masuk) * 100)
                  : item.margin || 0;

              const healthy = item.laba >= 0;

              return (
                <tr key={item[labelKey]} className="border-t border-[#F3F3F3]">
                  <td className="px-5 py-4 font-black">{item[labelKey]}</td>
                  <td className="px-5 py-4 font-black text-green-600">
                    {rp(item.masuk)}
                  </td>
                  <td className="px-5 py-4 font-black text-red-600">
                    {rp(item.keluar)}
                  </td>
                  <td
                    className={`px-5 py-4 font-black ${healthy ? "text-orange-600" : "text-red-600"
                      }`}
                  >
                    {rp(item.laba)}
                  </td>
                  <td className="px-5 py-4 font-black">{margin}%</td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${healthy
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                        }`}
                    >
                      {healthy ? "Sehat" : "Rugi"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoryBreakdown({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-[2rem] p-5">
      <h2 className="text-xl font-black mb-1">Pengeluaran per Kategori</h2>
      <p className="text-sm text-gray-400 font-semibold mb-5">
        Mengetahui kategori biaya terbesar.
      </p>

      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 font-bold">
            Belum ada data pengeluaran.
          </p>
        ) : (
          data.map((item) => {
            const cfg = categoryConfig[item.category] || categoryConfig.Lainnya;
            const width = (item.total / max) * 100;

            return (
              <div key={item.category}>
                <div className="flex justify-between mb-2">
                  <span className={`font-black ${cfg.text}`}>
                    {item.category}
                  </span>
                  <span className="font-black">{rp(item.total)}</span>
                </div>

                <div className="h-3 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cfg.bar} rounded-full`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PaymentBreakdown({ data }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-[2rem] p-5">
      <h2 className="text-xl font-black mb-1">Pemasukan per Payment</h2>
      <p className="text-sm text-gray-400 font-semibold mb-5">
        Sumber pemasukan berdasarkan metode pembayaran.
      </p>

      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 font-bold">
            Belum ada pemasukan paid.
          </p>
        ) : (
          data.map((item) => {
            const percent =
              total === 0 ? 0 : Math.round((item.total / total) * 100);

            return (
              <div key={item.method}>
                <div className="flex justify-between mb-2">
                  <span className="font-black uppercase flex items-center gap-2">
                    <CreditCard size={15} />
                    {item.method}
                  </span>
                  <span className="font-black text-[#8A5F41]">
                    {rp(item.total)} • {percent}%
                  </span>
                </div>

                <div className="h-3 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8A5F41] rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ExpenseModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: today(),
    description: "",
    amount: "",
    category: "Bahan Baku",
  });

  const submit = () => {
    if (!form.description.trim() || !Number(form.amount)) return;

    onSave({
      date: form.date,
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[2rem] overflow-hidden">
        <div className="px-6 py-5 bg-[#4A2C2A] text-white flex justify-between">
          <div>
            <h2 className="text-xl font-black">Tambah Pengeluaran</h2>
            <p className="text-sm text-white/70">Input biaya bisnis</p>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Input
            label="Tanggal"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <Input
            label="Keterangan"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <Input
            label="Jumlah"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <div>
            <label className="text-sm font-black">Kategori</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
            >
              {expenseCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
            >
              Batal
            </button>

            <button
              onClick={submit}
              className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-black">{label}</label>
      <input
        {...props}
        className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
      />
    </div>
  );
}