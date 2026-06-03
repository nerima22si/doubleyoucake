import { Plus, Package } from "lucide-react";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function ProductCard({ product, onAdd }) {
    return (
        <button
            onClick={() => onAdd(product)}
            className="w-full bg-white border border-[#E7DED7] rounded-[1.5rem] sm:rounded-3xl overflow-hidden text-left transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
        >
            <div className="h-36 sm:h-40 lg:h-44 xl:h-48 bg-[#F7F3EE] flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={34} className="text-[#8A5F41]" />
                )}
            </div>

            <div className="p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold mb-1 truncate">
                    {product.category_name}
                </p>

                <h3 className="font-black text-[#4A2C2A] leading-tight text-sm sm:text-base line-clamp-2 min-h-[38px]">
                    {product.name}
                </h3>

                <div className="mt-3 sm:mt-4 flex items-center justify-between gap-3">
                    <p className="font-black text-[#8A5F41] text-sm sm:text-base truncate">
                        {formatRupiah(product.price)}
                    </p>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#4A2C2A] text-white flex items-center justify-center shrink-0">
                        <Plus size={18} />
                    </div>
                </div>
            </div>
        </button>
    );
}