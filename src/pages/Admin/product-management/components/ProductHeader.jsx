import { Plus } from "lucide-react";

export default function ProductHeader({
    activeTab,
    setActiveTab,
    onAddProduct,
    onAddCategory,
}) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
                <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                    Catalog Management
                </p>

                <h1 className="text-4xl font-black text-[#4A2C2A] mt-1">
                    Product Management
                </h1>

                <p className="text-sm text-gray-500 font-semibold mt-1">
                    Kelola produk, kategori, harga, gambar, dan status katalog.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white border border-[#E7DED7] rounded-2xl p-1 flex">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`px-5 py-2 rounded-xl text-sm font-black transition ${activeTab === "products"
                                ? "bg-[#4A2C2A] text-white"
                                : "text-gray-500 hover:bg-[#F6F1EC]"
                            }`}
                    >
                        Products
                    </button>

                    <button
                        onClick={() => setActiveTab("categories")}
                        className={`px-5 py-2 rounded-xl text-sm font-black transition ${activeTab === "categories"
                                ? "bg-[#4A2C2A] text-white"
                                : "text-gray-500 hover:bg-[#F6F1EC]"
                            }`}
                    >
                        Categories
                    </button>
                </div>

                {activeTab === "products" ? (
                    <button
                        onClick={onAddProduct}
                        className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2 hover:bg-[#8A5F41] transition"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                ) : (
                    <button
                        onClick={onAddCategory}
                        className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2 hover:bg-[#8A5F41] transition"
                    >
                        <Plus size={18} />
                        Add Category
                    </button>
                )}
            </div>
        </div>
    );
}