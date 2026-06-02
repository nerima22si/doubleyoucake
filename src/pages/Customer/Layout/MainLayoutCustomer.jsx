import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import NavbarCust from "../Component/Navbar";
import Footer from "../Component/Footer";

const MainLayoutCustomer = () => {
    useEffect(() => {
        document.title = "Double You Cake";
    }, []);

    return (
        <>
            <NavbarCust />
            <main className="">
                <Outlet />
            </main>
            <Footer />
        </>
    );
};

export default MainLayoutCustomer;
