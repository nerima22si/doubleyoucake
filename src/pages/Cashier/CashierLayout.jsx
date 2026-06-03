import { Outlet } from "react-router-dom";
import { useState } from "react";
import SidebarCashier from "../../Layout/SidebarCashier";

export default function CashierLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <SidebarCashier open={sidebarOpen} setOpen={setSidebarOpen} />

            <main
                className={`
                    min-h-screen transition-all duration-300
                    p-4 sm:p-5 lg:p-6 pt-20
                    ${sidebarOpen ? "xl:ml-72" : "xl:ml-0"}
                `}
            >
                <Outlet />
            </main>
        </div>
    );
}