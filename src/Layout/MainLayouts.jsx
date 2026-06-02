// ===============================
// MainLayout.jsx
// ===============================

import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  useEffect(() => {
    document.title = "Admin Double You Cake";
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb] font-poppins">
      {/* SIDEBAR */}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT */}

      <div
        className="
          min-h-screen
          flex flex-col
          transition-all duration-300

          xl:ml-72
        "
      >
        {/* HEADER */}

        <Header
          setIsSidebarOpen={
            setIsSidebarOpen
          }
        />

        {/* PAGE */}

        <main
          className="
            flex-1 overflow-y-auto
            p-4 sm:p-5 lg:p-6
          "
        >
          <div
            className="
              w-full
              max-w-[1600px]
              mx-auto
            "
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}