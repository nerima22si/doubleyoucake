import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ReceiptText,
    LogOut,
    ClipboardCheck,
    MonitorSmartphone,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SidebarCashier() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const menu = [
        {
            name: "Cashier Dashboard",
            path: "dashboard/cashier",
            icon: <LayoutDashboard size={20} />,
        },
        {
            name: "POS System",
            path: "/cashier/pos",
            icon: <MonitorSmartphone size={20} />,
        },
        {
            name: "Order Payment",
            path: "/cashier/orders",
            icon: <ReceiptText size={20} />,
        },
        {
            name: "Closing Shift",
            path: "/cashier/closing",
            icon: <ClipboardCheck size={20} />,
        },
    ];

    const handleLogout = async () => {
        navigate("/cashier/closing?logout=true");
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-100 shadow-sm flex flex-col">
            <div className="px-6 py-6 border-b border-gray-100 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden border-4 border-orange-100 shadow-md">
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
                    Cashier Panel
                </p>
            </div>

            <div className="flex-1 px-4 py-5">
                <p className="text-[11px] font-semibold text-[#A47251] tracking-[0.2em] px-3 mb-3">
                    CASHIER MENU
                </p>

                <nav className="space-y-1.5">
                    {menu.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
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
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-medium">
                        Logout / Closing
                    </span>
                </button>
            </div>
        </aside>
    );
}