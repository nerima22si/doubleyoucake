// SidebarCust.jsx

import { useEffect, useRef, useState } from "react";

import {
  LayoutDashboard,
  Heart,
  Settings,
  LogOut,
  ShoppingBag,
  X,
  ShoppingCart,
  ReceiptText,
  MessageCircle,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const SidebarCustomer = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const userRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    initNotifications();

    const channel = supabase
      .channel("customer-sidebar-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        () => fetchCartCount()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carts" },
        () => fetchCartCount()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => fetchUnreadChats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_rooms" },
        () => fetchUnreadChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const initNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userRef.current = user;

    if (!user) {
      setCartCount(0);
      setUnreadChats(0);
      return;
    }

    await fetchCartCount(user.id);
    await fetchUnreadChats(user.id);
  };

  const fetchCartCount = async (userIdParam) => {
    const userId = userIdParam || userRef.current?.id;
    if (!userId) return;

    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartError || !cartData) {
      setCartCount(0);
      return;
    }

    const { data: itemData, error: itemError } = await supabase
      .from("cart_items")
      .select("qty")
      .eq("cart_id", cartData.id);

    if (itemError) {
      setCartCount(0);
      return;
    }

    const totalQty = (itemData || []).reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    );

    setCartCount(totalQty);
  };

  const fetchUnreadChats = async (userIdParam) => {
    const userId = userIdParam || userRef.current?.id;
    if (!userId) return;

    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (roomError || !roomData || roomData.length === 0) {
      setUnreadChats(0);
      return;
    }

    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomData[0].id)
      .eq("sender_role", "admin")
      .eq("is_read", false);

    if (error) {
      setUnreadChats(0);
      return;
    }

    setUnreadChats(count || 0);
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/customer/dashboard",
      icon: <LayoutDashboard size={20} strokeWidth={2.2} />,
    },
    {
      name: "Produk",
      path: "/customer/products",
      icon: <ShoppingBag size={20} strokeWidth={2.2} />,
    },
    {
      name: "Keranjang",
      path: "/customer/cart",
      icon: <ShoppingCart size={20} strokeWidth={2.2} />,
    },
    {
      name: "Riwayat Pesanan",
      path: "/customer/my-orders",
      icon: <ReceiptText size={20} strokeWidth={2.2} />,
    },
    {
      name: "Chat",
      path: "/customer/chat",
      icon: <MessageCircle size={20} strokeWidth={2.2} />,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getBadgeCount = (itemName) => {
    if (itemName === "Keranjang") return cartCount;
    if (itemName === "Chat") return unreadChats;
    return 0;
  };

  return (
    <>
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .hide-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }
      `}</style>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 xl:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-72
          bg-white
          border-r border-gray-100
          shadow-sm
          transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0
        `}
      >
        <div className="px-6 pt-6 pb-5 border-b border-gray-100 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="xl:hidden absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-orange-50 transition"
          >
            <X size={18} className="text-gray-600" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-orange-100 shadow-md">
              <img
                src="/fonts/double-you-logo.jpg"
                alt="logo"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="mt-4 text-lg font-bold text-[#8C5A3C]">
              Double You Cake
            </h1>

            <p className="text-xs text-gray-400 mt-1">
              Customer Dashboard
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-5">
          <div>
            <p className="text-[11px] font-semibold text-[#A47251] tracking-[0.2em] px-3 mb-3">
              MENU
            </p>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const badgeCount = getBadgeCount(item.name);

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3
                      px-4 py-3
                      rounded-2xl
                      transition-all duration-200
                      ${isActive(item.path)
                        ? "bg-gradient-to-r from-amber-100 to-[#8A5F41] text-[#4B2E2B] shadow-md"
                        : "text-gray-700 hover:bg-orange-50"
                      }
                    `}
                  >
                    {item.icon}

                    <span className="text-sm font-medium">
                      {item.name}
                    </span>

                    {badgeCount > 0 && (
                      <span className="ml-auto min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8">
            <p className="text-[11px] font-semibold text-[#A47251] tracking-[0.2em] px-3 mb-3">
              AKUN
            </p>

            <div className="space-y-1.5">
              <Link
                to="/customer/profile"
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3
                  px-4 py-3
                  rounded-2xl
                  transition-all duration-200
                  ${isActive("/customer/profile")
                    ? "bg-gradient-to-r from-amber-100 to-[#8A5F41] text-[#4B2E2B] shadow-md"
                    : "text-gray-700 hover:bg-orange-50"
                  }
                `}
              >
                <Settings size={20} />

                <span className="text-sm font-medium">
                  Pengaturan Akun
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200 w-full text-left"
              >
                <LogOut size={20} />

                <span className="text-sm font-medium">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-[#FFF7ED] rounded-2xl p-4 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#8C5A3C] text-white p-2.5 rounded-xl shadow-sm">
                <ShoppingBag size={18} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#4B2E2B]">
                  Freshly Baked Daily
                </p>

                <p className="text-xs text-gray-500 leading-snug">
                  Pesan kue favoritmu dengan mudah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarCustomer;