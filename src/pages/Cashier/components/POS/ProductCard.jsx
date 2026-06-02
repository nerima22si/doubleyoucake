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
            className="bg-white border border-[#E7DED7] rounded-3xl overflow-hidden text-left transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
        >
            <div className="h-44 bg-[#F7F3EE] flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package size={38} className="text-[#8A5F41]" />
                )}
            </div>

            <div className="p-4">
                <p className="text-xs text-gray-400 font-semibold mb-1">
                    {product.category_name}
                </p>

                <h3 className="font-black text-[#4A2C2A] leading-tight">
                    {product.name}
                </h3>

                <div className="mt-4 flex items-center justify-between">
                    <p className="font-black text-[#8A5F41]">
                        {formatRupiah(product.price)}
                    </p>

                    <div className="w-10 h-10 rounded-2xl bg-[#4A2C2A] text-white flex items-center justify-center">
                        <Plus size={18} />
                    </div>
                </div>
            </div>
        </button>
    );
}