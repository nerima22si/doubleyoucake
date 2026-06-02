import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Bell,
  ChevronRight,
  AlertTriangle,
  RefreshCcw,
  Store,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
};

const statusStyle = {
  Masuk: "bg-orange-50 text-orange-700",
  Diproses: "bg-blue-50 text-blue-700",
  Selesai: "bg-green-50 text-green-700",
  Dibatalkan: "bg-red-50 text-red-700",
  "Open Bill": "bg-yellow-50 text-yellow-700",
};

const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (dateA, dateB) => {
  const a = getStartOfDay(dateA);
  const b = getStartOfDay(dateB);
  return a.getTime() === b.getTime();
};

const percentChange = (current, previous) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();

    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        fetchDashboard(false)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () =>
        fetchDashboard(false)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        fetchDashboard(false)
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "raw_materials" }, () =>
        fetchDashboard(false)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchDashboard = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [ordersRes, productsRes, profilesRes, materialsRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select(`
              *,
              order_items (
                id,
                qty,
                quantity,
                price,
                product_name,
                products:product_id (
                  id,
                  name,
                  category_id,
                  categories:category_id (
                    id,
                    name
                  )
                )
              )
            `)
            .order("created_at", { ascending: false }),

          supabase.from("products").select("*"),
          supabase.from("profiles").select("*"),
          supabase.from("raw_materials").select("*"),
        ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (materialsRes.error) throw materialsRes.error;

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setProfiles(profilesRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (error) {
      console.error("Dashboard error:", error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayOrders = orders.filter((o) => sameDay(o.created_at, today));
    const yesterdayOrders = orders.filter((o) => sameDay(o.created_at, yesterday));

    const completedOrders = orders.filter((o) => o.status === "Selesai");

    const todayRevenue = todayOrders
      .filter((o) => o.status === "Selesai")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const yesterdayRevenue = yesterdayOrders
      .filter((o) => o.status === "Selesai")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + Number(o.total_price || 0),
      0
    );

    const onlineOrders = orders.filter((o) => (o.order_source || "online") === "online");
    const offlineOrders = orders.filter((o) => o.order_source === "offline");

    const onlineRevenue = completedOrders
      .filter((o) => (o.order_source || "online") === "online")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const offlineRevenue = completedOrders
      .filter((o) => o.order_source === "offline")
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

    const lowMaterials = materials.filter((m) => {
      const current = Number(m.current_stock || 0);
      const reorder = Number(m.reorder_point || 0);
      return current <= reorder;
    });

    return {
      todayRevenue,
      yesterdayRevenue,
      revenueTrend: percentChange(todayRevenue, yesterdayRevenue),
      todayOrders: todayOrders.length,
      yesterdayOrders: yesterdayOrders.length,
      orderTrend: percentChange(todayOrders.length, yesterdayOrders.length),
      totalRevenue,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingOrders: orders.filter((o) => o.status === "Masuk").length,
      processOrders: orders.filter((o) => o.status === "Diproses").length,
      openBills: orders.filter((o) => o.status === "Open Bill").length,
      cancelledOrders: orders.filter((o) => o.status === "Dibatalkan").length,
      onlineOrders: onlineOrders.length,
      offlineOrders: offlineOrders.length,
      onlineRevenue,
      offlineRevenue,
      totalProducts: products.length,
      totalCustomers: profiles.filter((p) => p.role === "customer").length,
      lowMaterials,
    };
  }, [orders, products, profiles, materials]);

  const revenueChart = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayOrders = orders.filter((o) => sameDay(o.created_at, date));
      const revenue = dayOrders
        .filter((o) => o.status === "Selesai")
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

      days.push({
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        value: revenue,
      });
    }

    return days;
  }, [orders]);

  const orderChart = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const count = orders.filter((o) => sameDay(o.created_at, date)).length;

      days.push({
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        value: count,
      });
    }

    return days;
  }, [orders]);

  const topCategories = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      (order.order_items || []).forEach((item) => {
        const categoryName =
          item.products?.categories?.name || "Tanpa Kategori";
        const qty = Number(item.qty ?? item.quantity ?? 0);

        if (!map[categoryName]) {
          map[categoryName] = {
            name: categoryName,
            qty: 0,
          };
        }

        map[categoryName].qty += qty;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      (order.order_items || []).forEach((item) => {
        const name = item.products?.name || item.product_name || "Produk";
        const qty = Number(item.qty ?? item.quantity ?? 0);

        if (!map[name]) {
          map[name] = {
            name,
            qty: 0,
          };
        }

        map[name].qty += qty;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const paymentMethods = useMemo(() => {
    const methods = ["cash", "qris", "transfer"];

    return methods.map((method) => {
      const count = orders.filter(
        (o) => o.payment_method === method && o.payment_status === "paid"
      ).length;

      return {
        name: method.toUpperCase(),
        value: count,
      };
    });
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 6).map((order) => {
      const items = order.order_items || [];

      const productSummary =
        items
          .map((item) => item.products?.name || item.product_name)
          .filter(Boolean)
          .join(", ") || "-";

      return {
        id: order.id,
        customer:
          order.customer_name ||
          order.customer ||
          order.name ||
          "Walk In Customer",
        productSummary,
        total: Number(order.total_price || 0),
        status: order.status || "Masuk",
        source: order.order_source || "online",
        created_at: order.created_at,
      };
    });
  }, [orders]);

  const notifications = useMemo(() => {
    const list = [];

    if (analytics.pendingOrders > 0) {
      list.push({
        title: `${analytics.pendingOrders} order baru masuk`,
        desc: "Pesanan online perlu segera diproses.",
        icon: <ShoppingBag size={18} />,
        bg: "bg-orange-50 text-orange-700",
      });
    }

    if (analytics.openBills > 0) {
      list.push({
        title: `${analytics.openBills} open bill aktif`,
        desc: "Open bill dari POS belum dibayar.",
        icon: <Store size={18} />,
        bg: "bg-yellow-50 text-yellow-700",
      });
    }

    if (analytics.lowMaterials.length > 0) {
      list.push({
        title: `${analytics.lowMaterials.length} bahan baku low stock`,
        desc: "Segera lakukan restock bahan baku.",
        icon: <AlertTriangle size={18} />,
        bg: "bg-red-50 text-red-700",
      });
    }

    return list;
  }, [analytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-10 text-center">
          <div className="w-14 h-14 border-4 border-[#E7DED7] border-t-[#4A2C2A] rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-black text-[#4A2C2A]">
            Memuat dashboard admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 text-[#4A2C2A]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
              Doubleyou.Cake Admin
            </p>

            <h1 className="text-4xl font-black mt-1">Dashboard Admin</h1>

            <p className="text-sm text-gray-500 font-semibold mt-1">
              Ringkasan penjualan, order online/offline, produk, customer, dan bahan baku.
            </p>
          </div>

          <button
            onClick={() => fetchDashboard()}
            className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2 hover:bg-[#8A5F41]"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Revenue Today"
            value={formatRupiah(analytics.todayRevenue)}
            trend={analytics.revenueTrend}
            icon={<DollarSign size={22} />}
          />

          <StatCard
            title="Orders Today"
            value={analytics.todayOrders}
            trend={analytics.orderTrend}
            icon={<ShoppingBag size={22} />}
          />

          <StatCard
            title="Online Orders"
            value={analytics.onlineOrders}
            desc={formatRupiah(analytics.onlineRevenue)}
            icon={<Wifi size={22} />}
          />

          <StatCard
            title="Offline / POS"
            value={analytics.offlineOrders}
            desc={formatRupiah(analytics.offlineRevenue)}
            icon={<Store size={22} />}
          />

          <StatCard
            title="Customers"
            value={analytics.totalCustomers}
            desc={`${analytics.totalProducts} produk`}
            icon={<Users size={22} />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <ChartCard
            title="Revenue 7 Hari Terakhir"
            desc="Pendapatan dari order selesai."
            data={revenueChart}
            type="currency"
            icon={<TrendingUp size={22} />}
          />

          <ChartCard
            title="Order 7 Hari Terakhir"
            desc="Jumlah order harian."
            data={orderChart}
            type="number"
            icon={<BarChart3 size={22} />}
          />

          <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
                <Bell size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">Notifikasi</h2>
                <p className="text-xs text-gray-400 font-bold">
                  Update penting sistem
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 font-bold">
                  Tidak ada notifikasi penting.
                </p>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 border border-[#E7DED7] rounded-2xl p-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}
                    >
                      {item.icon}
                    </div>

                    <div>
                      <p className="font-black text-sm">{item.title}</p>
                      <p className="text-xs text-gray-400 font-semibold mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <RankingCard
            title="Top Kategori"
            desc="Kategori produk paling banyak terjual."
            data={topCategories}
          />

          <RankingCard
            title="Top Produk"
            desc="Produk paling sering dibeli customer."
            data={topProducts}
          />

          <PaymentCard data={paymentMethods} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 bg-white border border-[#E7DED7] rounded-[2rem] overflow-hidden">
            <div className="p-5 border-b border-[#E7DED7] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Pesanan Terbaru</h2>
                <p className="text-sm text-gray-400 font-semibold">
                  Data terbaru dari tabel orders.
                </p>
              </div>

              <button
                onClick={() => navigate("/management-order")}
                className="text-sm font-black text-[#8A5F41] flex items-center gap-1"
              >
                Detail
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAFA] text-gray-500">
                    <th className="text-left px-5 py-4 font-black">Order</th>
                    <th className="text-left px-5 py-4 font-black">Customer</th>
                    <th className="text-left px-5 py-4 font-black">Source</th>
                    <th className="text-left px-5 py-4 font-black">Total</th>
                    <th className="text-left px-5 py-4 font-black">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-10 text-center text-gray-400 font-bold"
                      >
                        Belum ada pesanan.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8]"
                      >
                        <td className="px-5 py-4 font-black">
                          #{order.id}
                          <p className="text-xs text-gray-400 font-semibold mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {order.customer}
                          <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                            {order.productSummary}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <SourceBadge source={order.source} />
                        </td>

                        <td className="px-5 py-4 font-black text-[#8A5F41]">
                          {formatRupiah(order.total)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <LowStockCard materials={analytics.lowMaterials} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickAction
            title="Kelola Produk"
            desc={`${analytics.totalProducts} produk terdaftar`}
            icon={<Package size={22} />}
            onClick={() => navigate("/management-product")}
          />

          <QuickAction
            title="Kelola Order"
            desc={`${analytics.totalOrders} total order`}
            icon={<ShoppingBag size={22} />}
            onClick={() => navigate("/management-order")}
          />

          <QuickAction
            title="Bahan Baku"
            desc={`${analytics.lowMaterials.length} bahan low stock`}
            icon={<AlertTriangle size={22} />}
            onClick={() => navigate("/inventory")}
          />

          <QuickAction
            title="Payment"
            desc="Pantau metode pembayaran"
            icon={<CreditCard size={22} />}
            onClick={() => navigate("/management-payment")}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, desc, icon, trend }) {
  const showTrend = typeof trend !== "undefined";
  const isUp = Number(trend || 0) >= 0;

  return (
    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#F6F1EC] rounded-full blur-2xl opacity-70" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-bold">{title}</p>

          <h2 className="text-2xl font-black text-[#4A2C2A] mt-1">
            {value}
          </h2>

          {showTrend && (
            <div
              className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${isUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
            >
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(Number(trend || 0))}%
            </div>
          )}

          {desc && (
            <p className="text-xs text-gray-400 font-semibold mt-2">
              {desc}
            </p>
          )}
        </div>

        <div className="w-14 h-14 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, desc, data, type, icon }) {
  const max = Math.max(...data.map((d) => Number(d.value || 0)), 1);

  return (
    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="text-sm text-gray-400 font-semibold">{desc}</p>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="h-56 flex items-end gap-3">
        {data.map((item) => {
          const height = Math.max((Number(item.value || 0) / max) * 100, 8);

          return (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end h-40 bg-[#FAFAFA] rounded-2xl overflow-hidden">
                <div
                  className="w-full bg-[#8A5F41] rounded-t-2xl transition-all"
                  style={{ height: `${height}%` }}
                  title={
                    type === "currency"
                      ? formatRupiah(item.value)
                      : String(item.value)
                  }
                />
              </div>

              <p className="text-xs text-gray-400 font-bold">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm font-black text-[#4A2C2A]">
        Total:{" "}
        {type === "currency"
          ? formatRupiah(data.reduce((s, d) => s + Number(d.value || 0), 0))
          : data.reduce((s, d) => s + Number(d.value || 0), 0)}
      </div>
    </div>
  );
}

function RankingCard({ title, desc, data }) {
  const max = Math.max(...data.map((d) => Number(d.qty || 0)), 1);

  return (
    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black">{title}</h2>
        <p className="text-sm text-gray-400 font-semibold">{desc}</p>
      </div>

      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 font-bold">
            Belum ada data penjualan.
          </p>
        ) : (
          data.map((item, index) => {
            const width = (Number(item.qty || 0) / max) * 100;

            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center font-black">
                      {index + 1}
                    </div>

                    <p className="font-black">{item.name}</p>
                  </div>

                  <span className="text-sm font-black text-[#8A5F41]">
                    {item.qty}
                  </span>
                </div>

                <div className="h-3 bg-[#FAFAFA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8A5F41] rounded-full"
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

function PaymentCard({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black">Payment Method</h2>
          <p className="text-sm text-gray-400 font-semibold">
            Distribusi pembayaran order paid.
          </p>
        </div>

        <CreditCard className="text-[#8A5F41]" />
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const percent = total === 0 ? 0 : Math.round((item.value / total) * 100);

          return (
            <div key={item.name}>
              <div className="flex justify-between mb-2">
                <span className="font-black">{item.name}</span>
                <span className="text-sm font-black text-[#8A5F41]">
                  {item.value} order • {percent}%
                </span>
              </div>

              <div className="h-3 bg-[#FAFAFA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8A5F41] rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LowStockCard({ materials }) {
  return (
    <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-black">Low Stock Alert</h2>
          <p className="text-sm text-gray-400 font-semibold">
            Bahan baku yang harus segera direstock.
          </p>
        </div>

        <AlertTriangle className="text-red-500" />
      </div>

      <div className="space-y-3">
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400 font-bold">
            Semua bahan baku aman.
          </p>
        ) : (
          materials.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-[#F3F3F3] rounded-2xl p-4"
            >
              <div>
                <p className="font-black">{item.name}</p>
                <p className="text-xs text-gray-400 font-semibold mt-1">
                  Stock: {item.current_stock} {item.unit} • Reorder:{" "}
                  {item.reorder_point}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-black">
                Low
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source }) {
  const isOffline = source === "offline";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${isOffline ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
        }`}
    >
      {isOffline ? <Store size={13} /> : <Wifi size={13} />}
      {isOffline ? "Offline" : "Online"}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-black ${statusStyle[status] || "bg-gray-50 text-gray-600"
        }`}
    >
      {status || "Masuk"}
    </span>
  );
}

function QuickAction({ title, desc, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 text-left hover:bg-[#FFFBF5] transition"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="font-black text-[#4A2C2A]">{title}</h3>

      <p className="text-sm text-gray-400 font-semibold mt-1">
        {desc}
      </p>
    </button>
  );
}