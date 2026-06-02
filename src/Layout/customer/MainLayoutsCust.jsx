// MainLayoutCustomerLogin.jsx

import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import HeaderCustomer from "./HeaderCust";
import SidebarCustomer from "./SidebarCust";

export default function MainLayoutCustomerLogin() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    document.title =
      "Customer Double You Cake";
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* SIDEBAR */}
      <SidebarCustomer
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* MAIN */}
      <div
        className="
          flex-1 flex flex-col min-h-screen min-w-0
          xl:ml-72
        "
      >
        <HeaderCustomer
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="flex-1 overflow-y-auto">
          <div
            className="
              w-full
              px-4 sm:px-6 lg:px-8
              py-5
            "
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}