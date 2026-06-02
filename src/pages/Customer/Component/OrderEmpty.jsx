import { ShoppingBag } from "lucide-react";

const OrderEmpty = ({ navigate }) => {
    return (
        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-sm border border-[#EBD9C1] text-center">
            <div className="w-20 h-20 bg-[#FDF5E6] text-[#8B5E3C] rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={38} />
            </div>

            <h2 className="text-2xl md:text-3xl font-black">
                Belum ada pesanan
            </h2>

            <p className="text-slate-500 mt-3 font-medium">
                Yuk mulai pesan kue favoritmu sekarang.
            </p>

            <button
                onClick={() => navigate("/customer/products")}
                className="mt-8 px-10 py-4 bg-[#4A2C2A] text-white rounded-full font-black hover:bg-[#8B5E3C] transition-all shadow-lg"
            >
                Belanja Sekarang
            </button>
        </div>
    );
};

export default OrderEmpty;