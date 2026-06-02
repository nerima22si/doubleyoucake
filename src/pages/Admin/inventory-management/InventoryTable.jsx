import {
    Package,
    Eye,
    Plus,
    SlidersHorizontal,
    Search,
} from "lucide-react";
import { getStockStatus,formatAuditDateTime } from "./inventoryUtils";

export default function InventoryTable({
    inventory,
    search,
    setSearch,
    onDetail,
    onRestock,
    onAdjust,
}) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
            <div className="mb-5 flex items-center gap-3 bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl px-4 py-3">
                <Search size={18} className="text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari barang, kategori, atau status stok..."
                    className="w-full bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead>
                        <tr className="bg-[#FAFAFA] text-gray-500">
                            <th className="text-left px-5 py-4 font-black">
                                Barang
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Kategori
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Current
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Min
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Max
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Reorder
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Status
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Created At
                            </th>
                            <th className="text-left px-5 py-4 font-black">
                                Last Updated
                            </th>
                            <th className="text-right px-5 py-4 font-black">
                                Aksi
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {inventory.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="10"
                                    className="px-5 py-10 text-center text-gray-400 font-bold"
                                >
                                    Data stok barang tidak ditemukan.
                                </td>
                            </tr>
                        ) : (
                            inventory.map((item) => {
                                const status = getStockStatus(item);

                                return (
                                    <tr
                                        key={item.id}
                                        className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8] transition"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] border border-[#E7DED7] overflow-hidden flex items-center justify-center">
                                                    {item.products?.image_url ? (
                                                        <img
                                                            src={
                                                                item.products
                                                                    .image_url
                                                            }
                                                            alt={
                                                                item.products
                                                                    ?.name
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-black text-[#4A2C2A]">
                                                        {item.products?.name ||
                                                            "Barang"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-semibold">
                                                        Product #{item.product_id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-gray-500">
                                            {item.products?.categories?.name ||
                                                "-"}
                                        </td>

                                        <td className="px-5 py-4 font-black text-[#4A2C2A]">
                                            {item.current_stock}
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {item.min_stock}
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {item.max_stock}
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {item.reorder_point}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                style={{
                                                    background: status.bg,
                                                    color: status.color,
                                                }}
                                                className="px-3 py-1 rounded-full text-xs font-black"
                                            >
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-500 font-bold whitespace-nowrap">
                                            {formatAuditDateTime(item.created_at)}
                                        </td>

                                        <td className="px-5 py-4 text-xs text-gray-500 font-bold whitespace-nowrap">
                                            {formatAuditDateTime(item.updated_at)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        onDetail(item)
                                                    }
                                                    className="w-9 h-9 rounded-xl border border-[#E7DED7] bg-white flex items-center justify-center hover:bg-[#F6F1EC]"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        onRestock(item)
                                                    }
                                                    className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100"
                                                >
                                                    <Plus size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        onAdjust(item)
                                                    }
                                                    className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center hover:bg-orange-100"
                                                >
                                                    <SlidersHorizontal
                                                        size={16}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}