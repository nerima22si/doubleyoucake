import { Outlet } from "react-router-dom";
import SidebarCashier from "../../Layout/SidebarCashier";

export default function CashierLayout() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] flex">
            <SidebarCashier />

            <main className="flex-1 ml-72 p-6">
                <Outlet />
            </main>
        </div>
    );
}