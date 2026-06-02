import { Grid3X3 } from "lucide-react";

export default function CategoryTabs({
    categories = [],
    selectedCategoryId = "all",
    setSelectedCategoryId = () => { },
}) {
    const safeCategories = Array.isArray(categories) ? categories : [];

    return (
        <div className="mb-5">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {safeCategories.map((cat) => {
                    const active = String(selectedCategoryId) === String(cat.id);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`
                flex items-center gap-2
                px-5 py-3
                rounded-2xl
                whitespace-nowrap
                text-sm font-black
                border transition-all duration-200
                ${active
                                    ? "bg-[#4A2C2A] text-white border-[#4A2C2A] shadow-md"
                                    : "bg-white text-[#4A2C2A] border-[#E7DED7] hover:bg-[#F6F1EC]"
                                }
              `}
                        >
                            {cat.id === "all" && <Grid3X3 size={16} />}
                            {cat.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}