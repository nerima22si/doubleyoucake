import { Search } from "lucide-react";

export default function ProductSearch({ search, setSearch }) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-3xl p-4 mb-4">
            <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-400" />

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full outline-none text-sm font-semibold text-[#4A2C2A]"
                />
            </div>
        </div>
    );
}