import { Package, AlertTriangle, MinusCircle, TrendingUp } from "lucide-react";

export default function InventoryStatsCard({ stats }) {
    const cards = [
        {
            title: "Total Barang",
            value: stats.total,
            icon: <Package size={24} />,
        },
        {
            title: "Low Stock",
            value: stats.low,
            icon: <AlertTriangle size={24} />,
        },
        {
            title: "Out of Stock",
            value: stats.out,
            icon: <MinusCircle size={24} />,
        },
        {
            title: "Overstock",
            value: stats.over,
            icon: <TrendingUp size={24} />,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-bold">
                                {card.title}
                            </p>
                            <h2 className="text-3xl font-black text-[#4A2C2A] mt-1">
                                {card.value}
                            </h2>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}