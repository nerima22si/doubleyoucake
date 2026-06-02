import { useState, useEffect } from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const NavbarCust = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // WhatsApp handler
    const handleOrder = () => {
        const message = `Halo Doubleyou.Cake! Saya ingin memesan/bertanya tentang menu kue.`;

        window.open(
            `https://wa.me/628123456789?text=${encodeURIComponent(message)}`,
            '_blank'
        );
    };

    return (
        <>
            {/* Navbar */}
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                        ? 'bg-white/90 backdrop-blur-md shadow-sm py-3'
                        : 'bg-transparent py-5'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Logo */}
                    <div className="flex flex-col">
                        <span className="font-black text-xl md:text-2xl tracking-tighter leading-none text-[#4A2C2A]">
                            DOUBLEYOU.CAKE
                        </span>

                        <span className="text-[10px] tracking-[0.2em] font-bold opacity-60 text-[#4A2C2A]">
                            EST. 2021
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-[#4A2C2A]">

                        <Link
                            to="/"
                            className="hover:text-[#8B5E3C] transition-colors"
                        >
                            Beranda
                        </Link>

                        <Link
                            to="/Katalog"
                            className="hover:text-[#8B5E3C] transition-colors"
                        >
                            Katalog
                        </Link>

                        <Link
                            to="/tentang-kami"
                            className="hover:text-[#8B5E3C] transition-colors"
                        >
                            Tentang Kami
                        </Link>

                        {/* Login Button */}
                        <Link
                            to="/login"
                            className="px-6 py-2 bg-[#4A2C2A] text-white rounded-full hover:bg-[#8B5E3C] transition-all shadow-lg"
                        >
                            Login
                        </Link>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 text-[#4A2C2A]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
                <div className="fixed top-0 inset-x-0 z-40 bg-white pt-20 pb-8 px-6 shadow-xl md:hidden">

                    <div className="flex flex-col gap-6 text-[#4A2C2A] font-bold uppercase tracking-wider text-sm">

                        <Link
                            to="/"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:text-[#8B5E3C]"
                        >
                            Beranda
                        </Link>

                        <Link
                            to="/Katalog"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:text-[#8B5E3C]"
                        >
                            Katalog
                        </Link>

                        <Link
                            to="/TentangKami"
                            onClick={() => setIsMenuOpen(false)}
                            className="hover:text-[#8B5E3C]"
                        >
                            Tentang Kami
                        </Link>

                        {/* Mobile Login Button */}
                        <Link
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="px-6 py-3 bg-[#4A2C2A] text-white rounded-full hover:bg-[#8B5E3C] transition-all text-center"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            )}

            {/* Floating WhatsApp Button */}
            <button
                onClick={handleOrder}
                className="fixed bottom-8 right-8 md:hidden w-14 h-14 bg-[#4A2C2A] text-[#EBD9C1] rounded-full shadow-2xl flex items-center justify-center z-50 animate-bounce"
            >
                <MessageSquare size={24} fill="currentColor" />
            </button>
        </>
    );
};

export default NavbarCust;