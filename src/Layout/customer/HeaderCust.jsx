// HeaderCust.jsx

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
  CheckCircle2,
  Trash2,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "../../lib/supabase";

const HeaderCustomer = ({ onMenuClick }) => {
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
    return JSON.parse(
      localStorage.getItem("customer_read_notifications") || "[]"
    );
  });

  const [profile, setProfile] = useState({
    name: "Customer",
    role: "Customer",
    avatar_url: "",
    initials: "CU",
  });

  const [currentUser, setCurrentUser] = useState(null);

  const getClearedNotifIds = () => {
    return JSON.parse(
      localStorage.getItem("customer_cleared_notifications") || "[]"
    );
  };

  const saveClearedNotifIds = (ids) => {
    localStorage.setItem(
      "customer_cleared_notifications",
      JSON.stringify(ids)
    );
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

    initHeader();

    const channel = supabase
      .channel("customer-header-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          handleRealtimeOrder(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          handleRealtimeOrder(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          handleRealtimeChat(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

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

  const initHeader = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setCurrentUser(user);
    await getProfile(user.id);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;

    const routes = {
      "/customer/dashboard": {
        parent: "Customer",
        page: "Dashboard",
        title: "Dashboard Customer",
      },
      "/customer/products": {
        parent: "Customer",
        page: "Products",
        title: "Products",
      },
      "/customer/cart": {
        parent: "Customer",
        page: "Cart",
        title: "Shopping Cart",
      },
      "/customer/cart/checkout": {
        parent: "Customer",
        page: "Checkout",
        title: "Checkout",
      },
      "/customer/my-orders": {
        parent: "Customer",
        page: "My Orders",
        title: "My Orders",
      },
      "/customer/profile": {
        parent: "Customer",
        page: "Profile",
        title: "Customer Profile",
      },
      "/customer/chat": {
        parent: "Customer",
        page: "Chat",
        title: "Customer Chat",
      },
    };

    if (path.startsWith("/customer/my-orders/")) {
      return {
        parent: "Customer",
        page: "Order Detail",
        title: "Order Detail",
      };
    }

    return (
      routes[path] || {
        parent: "Customer",
        page: "Dashboard",
        title: "Dashboard Customer",
      }
    );
  };

  const breadcrumb = getBreadcrumb();

  const getProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
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
        "CU";

      setProfile({
        name: fullName || "Customer",
        role: data.role || "Customer",
        avatar_url: data.avatar_url || "",
        initials,
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const getOrderNotifText = (order) => {
    let title = "Order Update";
    let message = `Status pesanan #${order.id} diperbarui`;

    if (order.status === "Masuk") {
      title = "Pesanan Berhasil Dibuat";
      message = `Pesanan #${order.id} berhasil masuk dan menunggu konfirmasi admin`;
    } else if (order.status === "Diproses") {
      title = "Pesanan Diproses";
      message = `Pesanan #${order.id} sedang diproses`;
    } else if (order.status === "Selesai") {
      title = "Pesanan Selesai";
      message = `Pesanan #${order.id} sudah selesai`;
    } else if (order.status === "Dibatalkan") {
      title = "Pesanan Dibatalkan";
      message = `Pesanan #${order.id} telah dibatalkan`;
    }

    return { title, message };
  };

  const addNotification = (notif) => {
    const clearedIds = getClearedNotifIds();

    if (clearedIds.includes(notif.id)) return;

    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notif.id);

      if (exists) return prev;

      const updated = [notif, ...prev].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );

      updateUnreadCount(updated);
      return updated;
    });
  };

  const handleRealtimeOrder = async (payload) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const order = payload.new;

    if (!order || order.user_id !== user.id) return;

    const { title, message } = getOrderNotifText(order);

    addNotification({
      id: `order-${order.id}-${order.status}`,
      type: "order",
      title,
      message,
      time: new Date().toISOString(),
      path: `/customer/my-orders/${order.id}`,
    });
  };

  const handleRealtimeChat = async (payload) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const chat = payload.new;

    if (!chat) return;
    if (chat.sender_role !== "admin") return;

    addNotification({
      id: `chat-${chat.id}`,
      type: "chat",
      title: "Pesan Masuk",
      message: chat.message || "Admin mengirim pesan baru",
      time: chat.created_at || new Date().toISOString(),
      path: "/customer/chat",
    });
  };

  const fetchNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const clearedIds = getClearedNotifIds();
      const notifList = [];

      const { data: customerOrders, error: orderError } = await supabase
        .from("orders")
        .select("id, user_id, status, payment_status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (orderError) {
        console.log("Customer order notification error:", orderError.message);
      }

      (customerOrders || []).forEach((order) => {
        const { title, message } = getOrderNotifText(order);

        const notif = {
          id: `order-${order.id}-${order.status}`,
          type: "order",
          title,
          message,
          time: order.created_at,
          path: `/customer/my-orders/${order.id}`,
        };

        if (!clearedIds.includes(notif.id)) {
          notifList.push(notif);
        }
      });

      const { data: unreadChats, error: chatError } = await supabase
        .from("chat_messages")
        .select("id, room_id, message, created_at, sender_role, is_read")
        .eq("sender_role", "admin")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (chatError) {
        console.log("Customer chat notification error:", chatError.message);
      }

      (unreadChats || []).forEach((chat) => {
        const notif = {
          id: `chat-${chat.id}`,
          type: "chat",
          title: "Pesan Masuk",
          message: chat.message || "Admin mengirim pesan baru",
          time: chat.created_at,
          path: "/customer/chat",
        };

        if (!clearedIds.includes(notif.id)) {
          notifList.push(notif);
        }
      });

      notifList.sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(notifList);
      updateUnreadCount(notifList);
    } catch (error) {
      console.log("Fetch customer notifications error:", error.message);
    }
  };

  const markNotifAsRead = (notifId) => {
    const updatedReadIds = Array.from(
      new Set([...readNotifIds, notifId])
    );

    setReadNotifIds(updatedReadIds);

    localStorage.setItem(
      "customer_read_notifications",
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
    <header
      className="
        sticky top-0 z-40
        h-[72px]
        bg-white/95 backdrop-blur
        border-b border-gray-200
        px-4 sm:px-6
        flex items-center justify-between
      "
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="
            xl:hidden
            w-10 h-10
            rounded-xl
            border border-gray-200
            flex items-center justify-center
            bg-white
            hover:bg-orange-50
            transition
          "
        >
          <Menu size={18} className="text-gray-700" />
        </button>

        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <span className="text-gray-400">{breadcrumb.parent}</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 font-medium">
              {breadcrumb.page}
            </span>
          </div>

          <h1 className="text-[15px] sm:text-lg font-semibold text-gray-900">
            {breadcrumb.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="
            hidden md:flex
            items-center gap-2
            bg-gray-50
            border border-gray-200
            rounded-2xl
            px-4 py-2
            w-[230px]
          "
        >
          <Search size={15} className="text-gray-400" />

          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari sesuatu..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        <div
          className="
            hidden lg:flex
            items-center gap-2
            text-xs text-gray-500
            bg-gray-50
            border border-gray-200
            px-3 py-2
            rounded-xl
          "
        >
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          {dateLabel}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="
              relative
              w-10 h-10
              rounded-full
              border border-gray-200
              flex items-center justify-center
              hover:bg-orange-50
              transition
            "
          >
            <Bell size={16} className="text-gray-600" />

            {notifCount > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  min-w-[19px] h-[19px] px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-[10px]
                  font-black
                  flex items-center justify-center
                  border-2 border-white
                "
              >
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </button>

          {openNotif && (
            <div
              className="
                absolute right-0 mt-3
                w-80 bg-white
                border border-gray-200
                rounded-2xl
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">Notifications</p>
                  <p className="text-xs text-gray-400">
                    Customer activity updates
                  </p>
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="
                      flex items-center gap-1
                      text-xs
                      text-red-500
                      hover:text-red-600
                      font-medium
                    "
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

                    <p className="font-semibold text-gray-700">All clear</p>

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
                            w-9 h-9 rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${notif.type === "order"
                              ? "bg-orange-100 text-orange-600"
                              : notif.type === "chat"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-green-100 text-green-600"
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

        <button
          className="
            hidden sm:flex
            w-10 h-10
            rounded-full
            border border-gray-200
            items-center justify-center
            hover:bg-orange-50
            transition
          "
        >
          <Calendar size={16} className="text-gray-600" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown(!openDropdown)}
            className="
              flex items-center gap-2
              border border-gray-200
              rounded-full
              pl-1 pr-3 py-1
              hover:bg-orange-50
              transition
            "
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="
                  w-8 h-8 rounded-full
                  bg-gradient-to-br
                  from-orange-500 to-orange-400
                  text-white text-xs font-semibold
                  flex items-center justify-center
                "
              >
                {profile.initials}
              </div>
            )}

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-medium text-gray-800 leading-none">
                {profile.name}
              </span>

              <span className="text-[11px] text-gray-400 capitalize">
                {profile.role}
              </span>
            </div>

            <ChevronDown
              size={14}
              className="hidden sm:block text-gray-400"
            />
          </button>

          {openDropdown && (
            <div
              className="
                absolute right-0 mt-3
                w-56 bg-white
                border border-gray-200
                rounded-2xl
                shadow-xl
                overflow-hidden
                z-50
              "
            >
              <div className="px-4 py-4 border-b border-gray-100">
                <p className="font-semibold text-gray-800">
                  {profile.name}
                </p>

                <p className="text-sm text-gray-500">{profile.role}</p>
              </div>

              <button
                onClick={() => navigate("/customer/profile")}
                className="
                  w-full
                  flex items-center gap-3
                  px-4 py-3
                  text-sm
                  hover:bg-orange-50
                  transition
                "
              >
                <User size={16} />
                Profile
              </button>

              <button
                onClick={handleLogout}
                className="
                  w-full
                  flex items-center gap-3
                  px-4 py-3
                  text-sm
                  text-red-600
                  hover:bg-red-50
                  transition
                "
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderCustomer;