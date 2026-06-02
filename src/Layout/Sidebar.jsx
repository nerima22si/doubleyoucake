// ===============================
// Sidebar.jsx
// ===============================

import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BoxIcon,
  DollarSign,
  X,
  ReceiptText,
} from "lucide-react";

import { LuMessageSquareCode } from "react-icons/lu";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {supabase} from "../lib/supabase";
import { MdInventory } from "react-icons/md";



const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingOrders, setPendingOrders] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("sidebar-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        fetchNotifications
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        fetchNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "Masuk");

    const { count: chatCount } = await supabase
      .from("chat_messages")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("sender_role", "customer")
      .eq("is_read", false);

    setPendingOrders(orderCount || 0);
    setUnreadChats(chatCount || 0);
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard/admin",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Product Management",
      path: "/management-product",
      icon: <BoxIcon size={20} />,
    },
    {
      name: "Inventory Management",
      path: "/management-inventory",
      icon: <MdInventory size={20} />,
    },
    {
      name: "Order Management",
      path: "/management-order",
      icon: <Users size={20} />,
    },
    {
      name: "Order Payment",
      path: "/management-payment",
      icon: <ReceiptText size={20} />,
    },
    {
      name: "Financial Management",
      path: "/management-financial",
      icon: <DollarSign size={20} />,
    },
    {
      name: "Chat Customers",
      path: "/admin/chat",
      icon: <LuMessageSquareCode size={20} />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="
            fixed inset-0
            bg-black/40
            z-40
            xl:hidden
          "
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
        <div
          className="
            px-6 pt-6 pb-5
            border-b border-gray-100
            relative
          "
        >
          <button
            onClick={() => setIsOpen(false)}
            className="
              xl:hidden
              absolute top-5 right-5
              w-8 h-8
              rounded-xl
              flex items-center justify-center
              hover:bg-orange-50
              transition
            "
          >
            <X size={18} className="text-gray-600" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className="
                w-20 h-20
                rounded-3xl
                overflow-hidden
                border-4 border-orange-100
                shadow-md
              "
            >
              <img
                src="/fonts/double-you-logo.jpg"
                alt="logo"
                className="
                  w-full h-full
                  object-cover
                "
              />
            </div>

            <h1
              className="
                mt-4
                text-lg font-bold
                text-[#8C5A3C]
              "
            >
              Double You Cake
            </h1>

            <p
              className="
                text-xs text-gray-400
                mt-1
              "
            >
              Admin Dashboard
            </p>
          </div>
        </div>

        <div
          className="
            flex-1 overflow-y-auto
            px-4 py-5
            scrollbar-hide
          "
        >
          <div>
            <p
              className="
                text-[11px]
                font-semibold
                text-[#A47251]
                tracking-[0.2em]
                px-3 mb-3
              "
            >
              MENU
            </p>

            <nav className="space-y-1.5">
              {menuItems.map((item) => (
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

                  <span className="text-sm font-medium">{item.name}</span>

                  {item.name === "Order Management" && pendingOrders > 0 && (
                    <span
                      className="
                        ml-auto
                        min-w-[22px]
                        h-[22px]
                        px-1
                        rounded-full
                        bg-red-500
                        text-white
                        text-[10px]
                        font-black
                        flex items-center justify-center
                        shadow
                      "
                    >
                      {pendingOrders > 99 ? "99+" : pendingOrders}
                    </span>
                  )}

                  {item.name === "Chat Customers" && unreadChats > 0 && (
                    <span
                      className="
                        ml-auto
                        min-w-[22px]
                        h-[22px]
                        px-1
                        rounded-full
                        bg-red-500
                        text-white
                        text-[10px]
                        font-black
                        flex items-center justify-center
                        shadow
                      "
                    >
                      {unreadChats > 99 ? "99+" : unreadChats}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            <p
              className="
                text-[11px]
                font-semibold
                text-[#A47251]
                tracking-[0.2em]
                px-3 mb-3
              "
            >
              AKUN
            </p>

            <div className="space-y-1.5">
              <Link
                to="/profile"
                className={`
                  flex items-center gap-3
                  px-4 py-3
                  rounded-2xl
                  transition-all duration-200

                  ${isActive("/profile")
                    ? "bg-gradient-to-r from-amber-100 to-[#8A5F41] text-[#4B2E2B] shadow-md"
                    : "text-gray-700 hover:bg-orange-50"
                  }
                `}
              >
                <Settings size={20} />

                <span className="text-sm font-medium">Pengaturan Akun</span>
              </Link>

              <button
                onClick={handleLogout}
                className="
                  flex items-center gap-3
                  px-4 py-3
                  rounded-2xl
                  text-red-500
                  hover:bg-red-50
                  transition-all duration-200
                  w-full text-left
                "
              >
                <LogOut size={20} />

                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div
            className="
              bg-orange-50
              rounded-2xl
              p-4
              border border-orange-100
            "
          >
            <p
              className="
                text-sm font-semibold
                text-[#4B2E2B]
              "
            >
              Double You Cake
            </p>

            <p
              className="
                text-xs text-gray-500 mt-1
              "
            >
              Premium Cake Management
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;