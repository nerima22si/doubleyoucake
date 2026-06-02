import { Package, Pencil, Trash2 } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";
import { formatRupiah, formatDate, truncate } from "../../../../utils/productUtils";

export default function ProductTable({ products, loading, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-8 text-center font-bold text-gray-400">
                Loading products...
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead>
                        <tr className="bg-[#FAFAFA] text-gray-500">
                            <th className="text-left px-5 py-4 font-black">
                                Product
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Category
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Price
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Status
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Created
                            </th>
                            <th className="text-right px-5 py-4 font-black">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-5 py-12 text-center text-gray-400 font-bold"
                                >
                                    No product found.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr
                                    key={product.id}
                                    className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8] transition"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3 min-w-[260px]">
                                            <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] border border-[#E7DED7] overflow-hidden flex items-center justify-center shrink-0">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package size={20} />
                                                )}
                                            </div>

                                            <div>
                                                <p className="font-black text-[#4A2C2A]">
                                                    {product.name}
                                                </p>

                                                {product.description && (
                                                    <p className="text-xs text-gray-400 font-semibold mt-1">
                                                        {truncate(
                                                            product.description,
                                                            55
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#F6F1EC] text-[#8A5F41]">
                                            {product.categories?.name || "-"}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 font-black text-[#8A5F41]">
                                        {formatRupiah(product.price)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <ProductStatusBadge
                                            status={product.product_status}
                                        />
                                    </td>

                                    <td className="px-5 py-4 text-gray-400 font-semibold">
                                        {formatDate(product.created_at)}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
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
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}