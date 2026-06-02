import { Folder, Pencil, Trash2 } from "lucide-react";

export default function CategoryManagement({
    categories = [],
    loading = false,
    products = [],
    onEdit = () => { },
    onDelete = () => { },
}) {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeProducts = Array.isArray(products) ? products : [];

    if (loading) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-8 text-center font-bold text-gray-400">
                Loading categories...
            </div>
        );
    }

    const countProducts = (categoryId) => {
        return safeProducts.filter(
            (product) => String(product.category_id) === String(categoryId)
        ).length;
    };

    if (safeCategories.length === 0) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-12 text-center font-bold text-gray-400">
                No category found.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {safeCategories.map((cat) => (
                <div
                    key={cat.id}
                    className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 shadow-sm"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
                                <Folder size={22} />
                            </div>

                            <div>
                                <p className="font-black text-[#4A2C2A]">
                                    {cat.name}
                                </p>

                                <p className="text-xs text-gray-400 font-semibold mt-1">
                                    {countProducts(cat.id)} products
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(cat)}
                                className="w-9 h-9 rounded-xl border border-[#E7DED7] flex items-center justify-center hover:bg-[#F6F1EC]"
                            >
                                <Pencil size={15} />
                            </button>

                            <button
                                onClick={() => onDelete(cat)}
                                className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}