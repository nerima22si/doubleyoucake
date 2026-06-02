import { Grid2X2, List, Search } from "lucide-react";

export default function ProductSearchBar({
    search,
    setSearch,
    categoryId,
    setCategoryId,
    status,
    setStatus,
    categories,
    view,
    setView,
}) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 mb-6">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
                <div className="flex-1 flex items-center gap-3 bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl px-4 py-3">
                    <Search size={18} className="text-gray-400" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product, category, or description..."
                        className="w-full bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="px-4 py-3 rounded-2xl border border-[#E7DED7] bg-white text-sm font-bold text-[#4A2C2A] outline-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-3 rounded-2xl border border-[#E7DED7] bg-white text-sm font-bold text-[#4A2C2A] outline-none"
                    >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>

                    <div className="flex bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-1">
                        <button
                            onClick={() => setView("table")}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${view === "table"
                                    ? "bg-[#4A2C2A] text-white"
                                    : "text-[#4A2C2A]"
                                }`}
                        >
                            <List size={18} />
                        </button>

                        <button
                            onClick={() => setView("grid")}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${view === "grid"
                                    ? "bg-[#4A2C2A] text-white"
                                    : "text-[#4A2C2A]"
                                }`}
                        >
                            <Grid2X2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}