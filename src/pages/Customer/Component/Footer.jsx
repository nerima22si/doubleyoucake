import React from "react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-[#EBD9C1] px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-4 max-w-xs">
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-[#4A2C2A]">
              DOUBLEYOU.CAKE
            </span>
            <span className="text-xs tracking-[0.2em] font-bold opacity-60">
              EST. 2021
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Spesialis kue rumahan premium dan dekorasi kue kustom di kota Anda.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="font-black uppercase text-xs tracking-widest text-[#8B5E3C]">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm font-bold text-slate-500">
              <li><a href="#home">Beranda</a></li>
              <li><a href="#katalog">Katalog</a></li>
              <li><a href="#tentang">Tentang Kami</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-black uppercase text-xs tracking-widest text-[#8B5E3C]">
              Koleksi
            </h4>
            <ul className="space-y-2 text-sm font-bold text-slate-500">
              <li>Best Seller</li>
              <li>Seasonal</li>
              <li>Special Gift</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-black uppercase text-xs tracking-widest text-[#8B5E3C]">
              Jam Buka
            </h4>
            <div className="text-sm font-bold text-slate-500">
              Senin - Sabtu <br />
              09:00 - 18:00 WIB
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          © 2021 - {new Date().getFullYear()} Doubleyou.Cake
        </p>
      </div>
    </footer>
  );
};

export default Footer;