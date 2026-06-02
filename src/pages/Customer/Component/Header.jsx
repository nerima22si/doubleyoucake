import React from "react";
import { Menu, X } from "lucide-react";

const Header = ({ scrolled, isMenuOpen, setIsMenuOpen,  }) => {
    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="font-black text-xl md:text-2xl tracking-tighter leading-none">
                        DOUBLEYOU.CAKE
                    </span>
                    <span className="text-[10px] tracking-[0.2em] font-bold opacity-60">
                        EST. 2021
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
                    <a href="#home" className="hover:text-[#8B5E3C] transition-colors">
                        Beranda
                    </a>
                    <a href="#katalog" className="hover:text-[#8B5E3C] transition-colors">
                        Katalog
                    </a>
                    <a href="#tentang" className="hover:text-[#8B5E3C] transition-colors">
                        Tentang Kami
                    </a>
                    <button
                        onClick={() => window.location.href = "/login"}
                        className="px-6 py-2 bg-[#4A2C2A] text-white rounded-full hover:bg-[#8B5E3C] transition-all shadow-lg"
                    >
                        Login
                    </button>
                </div>

                <button
                    className="md:hidden p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
        </nav>
    );
};

export default Header;