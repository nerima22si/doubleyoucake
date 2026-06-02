import { Package, Pencil, Trash2 } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";
import {
    formatRupiah,
    truncate,
} from "../../../../utils/productUtils";

export default function ProductGrid({ products, loading, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-8 text-center font-bold text-gray-400">
                Loading products...
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-12 text-center font-bold text-gray-400">
                No product found.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="bg-white border border-[#E7DED7] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                    <div className="h-48 bg-[#F6F1EC] flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Package size={42} className="text-[#8A5F41]" />
                        )}
                    </div>

                    <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-black text-lg text-[#4A2C2A]">
                                    {product.name}
                                </h3>

                                <p className="text-xs text-gray-400 font-semibold mt-1">
                                    {product.categories?.name || "No Category"}
                                </p>
                            </div>

                            <ProductStatusBadge status={product.product_status} />
                        </div>

                        {product.description && (
                            <p className="text-sm text-gray-500 mt-3 font-semibold">
                                {truncate(product.description, 80)}
                            </p>
                        )}

                        <div className="mt-5 flex items-center justify-between">
                            <p className="text-xl font-black text-[#8A5F41]">
                                {formatRupiah(product.price)}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(product)}
                                    className="w-9 h-9 rounded-xl border border-[#E7DED7] bg-white text-[#8A5F41] flex items-center justify-center hover:bg-[#F6F1EC]"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => onDelete(product)}
                                    className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}