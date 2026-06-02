// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";

const UserLayout = () => {
    return (
        <CartProvider>
            <div className="min-h-screen bg-[#fffaf5]">
                {/* Navbar user di sini jika perlu */}
                <Outlet />
            </div>
        </CartProvider>
    );
};

export default UserLayout;
