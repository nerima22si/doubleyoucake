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
            className="w-full bg-white border border-[#E7DED7] rounded-[1.2rem] sm:rounded-[1.5rem] lg:rounded-3xl overflow-hidden text-left transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
        >
            <div className="h-24 sm:h-28 md:h-24 lg:h-36 xl:h-40 bg-[#F7F3EE] flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={30} className="text-[#8A5F41]" />
                )}
            </div>

            <div className="p-2.5 sm:p-3 lg:p-4">
                <p className="text-[9px] sm:text-[10px] lg:text-xs text-gray-400 font-semibold mb-1 truncate">
                    {product.category_name}
                </p>

                <h3 className="font-black text-[#4A2C2A] leading-tight text-xs sm:text-sm md:text-xs lg:text-base line-clamp-2 min-h-[32px] lg:min-h-[42px]">
                    {product.name}
                </h3>

                <div className="mt-2.5 sm:mt-3 lg:mt-4 flex items-center justify-between gap-2">
                    <p className="font-black text-[#8A5F41] text-xs sm:text-sm md:text-xs lg:text-base truncate">
                        {formatRupiah(product.price)}
                    </p>

                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-[#4A2C2A] text-white flex items-center justify-center shrink-0">
                        <Plus size={16} />
                    </div>
                </div>
            </div>
        </button>
    );
}