// ===============================
// Header.jsx
// ===============================

import { useState, useEffect, useRef } from "react";

import {
  Bell,
  Calendar,
  Search,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Package,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "../lib/supabase";

const Header = ({ setIsSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [dateLabel, setDateLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);

  const [readNotifIds, setReadNotifIds] = useState(() => {
    return JSON.parse(localStorage.getItem("admin_read_notifications") || "[]");
  });

  const [profile, setProfile] = useState({
    name: "Admin",
    role: "Admin",
    avatar_url: "",
    initials: "AD",
  });

  const getClearedNotifIds = () => {
    return JSON.parse(localStorage.getItem("admin_cleared_notifications") || "[]");
  };

  const saveClearedNotifIds = (ids) => {
    localStorage.setItem("admin_cleared_notifications", JSON.stringify(ids));
  };

  const updateUnreadCount = (notifList, readIds = readNotifIds) => {
    const unreadCount = notifList.filter(
      (notif) => !readIds.includes(notif.id)
    ).length;

    setNotifCount(unreadCount);
  };

  useEffect(() => {
    const d = new Date();

    setDateLabel(
      d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );

    getProfile();
    fetchNotifications();

    const channel = supabase
      .channel("admin-header-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchNotifications
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        fetchNotifications
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        fetchNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    updateUnreadCount(notifications, readNotifIds);
  }, [readNotifIds, notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdown(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setOpenNotif(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;

    const routes = {
      "/dashboard/admin": {
        parent: "Home",
        page: "Dashboard",
        title: "Dashboard Admin",
      },
      "/management-product": {
        parent: "Home",
        page: "Product Management",
        title: "Product Management",
      },
      "/management-order": {
        parent: "Home",
        page: "Order Management",
        title: "Order Management",
      },
      "/management-financial": {
        parent: "Home",
        page: "Financial Management",
        title: "Financial Management",
      },
      "/management-inventory": {
        parent: "Home",
        page: "Inventory Management",
        title: "Inventory Management",
      },
      "/management-payment": {
        parent: "Home",
        page: "Payment Monitoring",
        title: "Payment Monitoring",
      },
      "/admin/chat": {
        parent: "Home",
        page: "Customer Chat",
        title: "Customer Chat",
      },
      "/profile": {
        parent: "Home",
        page: "Profile",
        title: "Admin Profile",
      },
    };

    if (path.startsWith("/admin/chat/")) {
      return {
        parent: "Home",
        page: "Customer Chat",
        title: "Chat Detail",
      };
    }

    if (path.startsWith("/management-order/")) {
      return {
        parent: "Home",
        page: "Order Detail",
        title: "Order Detail",
      };
    }

    return (
      routes[path] || {
        parent: "Home",
        page: "Dashboard",
        title: "Dashboard Admin",
      }
    );
  };

  const breadcrumb = getBreadcrumb();

  const getProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log(error);
        return;
      }

      const fullName =
        data.full_name ||
        `${data.first_name || ""} ${data.last_name || ""}`.trim();

      const initials =
        `${data.first_name?.[0] || ""}${data.last_name?.[0] || ""}`.toUpperCase() ||
        "AD";

      setProfile({
        name: fullName || "Admin",
        role: data.role || "Admin",
        avatar_url: data.avatar_url || "",
        initials,
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifList = [];
      const clearedIds = getClearedNotifIds();

      const { data: newOrders, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          created_at,
          profiles:user_id (
            full_name
          )
        `)
        .eq("status", "Masuk")
        .order("created_at", { ascending: false })
        .limit(5);

      if (orderError) {
        console.log("Order notification error:", orderError.message);
      }

      (newOrders || []).forEach((order) => {
        notifList.push({
          id: `order-${order.id}`,
          type: "order",
          title: "New Order Received",
          message: `Order baru dari ${order.profiles?.full_name || "Customer"}`,
          time: order.created_at,
          path: "/management-order",
        });
      });

      const { data: unreadChats, error: chatError } = await supabase
        .from("chat_messages")
        .select("id, room_id, message, created_at, sender_role, is_read")
        .eq("sender_role", "customer")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (chatError) {
        console.log("Chat notification error:", chatError.message);
      }

      (unreadChats || []).forEach((chat) => {
        notifList.push({
          id: `chat-${chat.id}`,
          type: "chat",
          title: "New Customer Chat",
          message: chat.message || "Customer mengirim gambar",
          time: chat.created_at,
          path: `/admin/chat/${chat.room_id}`,
        });
      });

      const { data: lowStockProducts, error: stockError } = await supabase
        .from("products")
        .select("id, name, stock, created_at")
        .lte("stock", 5)
        .order("stock", { ascending: true })
        .limit(5);

      if (stockError) {
        console.log("Stock notification error:", stockError.message);
      }

      (lowStockProducts || []).forEach((product) => {
        notifList.push({
          id: `stock-${product.id}`,
          type: "stock",
          title: "Low Stock Alert",
          message: `${product.name} tersisa ${product.stock || 0} stok`,
          time: product.created_at,
          path: "/management-product",
        });
      });

      notifList.sort((a, b) => new Date(b.time) - new Date(a.time));

      const filteredNotif = notifList.filter(
        (notif) => !clearedIds.includes(notif.id)
      );

      setNotifications(filteredNotif);
      updateUnreadCount(filteredNotif);
    } catch (error) {
      console.log("Fetch notifications error:", error.message);
    }
  };

  const markNotifAsRead = (notifId) => {
    const updatedReadIds = Array.from(new Set([...readNotifIds, notifId]));

    setReadNotifIds(updatedReadIds);

    localStorage.setItem(
      "admin_read_notifications",
      JSON.stringify(updatedReadIds)
    );
  };

  const clearNotifications = () => {
    const currentIds = notifications.map((notif) => notif.id);
    const savedIds = getClearedNotifIds();

    const mergedIds = Array.from(new Set([...savedIds, ...currentIds]));

    saveClearedNotifIds(mergedIds);

    setNotifications([]);
    setNotifCount(0);
  };

  const formatNotifTime = (date) => {
    if (!date) return "";

    const fixedDate =
      typeof date === "string" && !date.endsWith("Z") && !date.includes("+")
        ? `${date}Z`
        : date;

    return new Date(fixedDate).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  const getNotifIcon = (type) => {
    if (type === "order") return <Package size={16} />;
    if (type === "chat") return <MessageCircle size={16} />;
    if (type === "stock") return <AlertTriangle size={16} />;
    return <CheckCircle2 size={16} />;
  };

  const handleNotifClick = (notif) => {
    markNotifAsRead(notif.id);
    setOpenNotif(false);
    navigate(notif.path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .header-root * {
          font-family: 'Poppins', sans-serif;
          box-sizing: border-box;
        }

        .search-box:focus-within {
          border-color: #EA580C !important;
          background: #fff;
        }

        .icon-btn:hover {
          background-color: #FFF7ED;
        }

        .avatar-btn:hover {
          background-color: #FFF7ED;
        }
      `}</style>

      <header className="header-root sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="xl:hidden w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-orange-50 transition"
            >
              <Menu size={18} className="text-gray-700" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">
                  {breadcrumb.parent}
                </span>

                <span className="text-[11px] text-gray-300">›</span>

                <span className="text-[11px] font-medium text-gray-600">
                  {breadcrumb.page}
                </span>
              </div>

              <h1 className="text-[15px] sm:text-[17px] font-semibold text-gray-900">
                {breadcrumb.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex search-box items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-[220px] transition">
              <Search size={14} color="#9ca3af" />

              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sesuatu..."
                className="bg-transparent outline-none border-none text-[13px] w-full text-gray-700"
              />
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {dateLabel}
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setOpenNotif(!openNotif)}
                className="icon-btn relative w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center transition"
              >
                <Bell size={16} color="#6b7280" />

                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Notifications
                      </p>

                      <p className="text-xs text-gray-400">
                        Admin activity updates
                      </p>
                    </div>

                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        <Trash2 size={14} />
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <CheckCircle2
                          size={34}
                          className="mx-auto text-green-500 mb-2"
                        />

                        <p className="font-semibold text-gray-700">
                          All clear
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Belum ada notifikasi baru
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isRead = readNotifIds.includes(notif.id);

                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`
                              w-full
                              px-4 py-3
                              flex gap-3
                              text-left
                              transition
                              border-b border-gray-50
                              last:border-b-0
                              ${isRead
                                ? "bg-white hover:bg-orange-50"
                                : "bg-[#8A5F41]/10 hover:bg-[#8A5F41]/20"
                              }
                            `}
                          >
                            <div
                              className={`
                                w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                ${notif.type === "order"
                                  ? "bg-orange-100 text-orange-600"
                                  : notif.type === "chat"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                                }
                              `}
                            >
                              {getNotifIcon(notif.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800">
                                  {notif.title}
                                </p>

                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#8A5F41] shrink-0 mt-1.5" />
                                )}
                              </div>

                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>

                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[11px] text-gray-400">
                                  {formatNotifTime(notif.time)}
                                </p>

                                {!isRead && (
                                  <span className="text-[10px] font-semibold text-[#8A5F41]">
                                    Baru
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="hidden sm:flex icon-btn w-10 h-10 rounded-full border border-gray-200 bg-white items-center justify-center transition">
              <Calendar size={16} color="#6b7280" />
            </button>

            <div className="hidden sm:block w-px h-7 bg-gray-200" />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenDropdown(!openDropdown)}
                className="avatar-btn flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-1 pr-3 py-1 transition"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-orange-500 to-orange-400">
                    {profile.initials}
                  </div>
                )}

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[13px] font-medium text-gray-800 leading-tight">
                    {profile.name}
                  </span>

                  <span className="text-[11px] text-gray-400 leading-tight capitalize">
                    {profile.role}
                  </span>
                </div>

                <ChevronDown size={13} className="text-gray-400" />
              </button>

              {openDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">
                      {profile.name}
                    </p>

                    <p className="text-sm text-gray-500 capitalize">
                      {profile.role}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-orange-50 transition"
                  >
                    <User size={16} />
                    My Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;