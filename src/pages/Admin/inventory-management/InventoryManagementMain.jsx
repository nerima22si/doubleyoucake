import RawMaterialManagement from "./RawMaterialManagement";

export default function InventoryManagementMain() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] p-6 text-[#4A2C2A]">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                            Raw Material Inventory
                        </p>

                        <h1 className="text-4xl font-black mt-1">
                            Stock Bahan Baku
                        </h1>

                        <p className="text-sm text-gray-500 font-semibold mt-1">
                            Kelola stok bahan baku seperti tepung, gula, mentega, telur, dan material produksi lainnya.
                        </p>
                    </div>
                </div>

                <RawMaterialManagement />
            </div>
        </div>
    );
}