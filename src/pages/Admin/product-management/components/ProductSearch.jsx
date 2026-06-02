import { Search, LayoutGrid, List } from "lucide-react";

export default function ProductSearch({
    search,
    onSearch,
    categoryId,
    onCategory,
    categories,
    view,
    onView
}) {
    return (
        <div className="pm-card-header" style={{ gap: 12 }}>

            {/* SEARCH + FILTER */}
            <div className="pm-search-bar" style={{ flex: 1, display: "flex", gap: 12 }}>

                {/* Search */}
                <div className="pm-search-wrap" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Search size={16} color="#8A5F41" />
                    <input
                        className="pm-input"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                {/* Category */}
                <select
                    className="pm-select"
                    value={categoryId || ""}
                    onChange={(e) =>
                        onCategory(e.target.value ? Number(e.target.value) : null)
                    }
                >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* VIEW TOGGLE */}
            <div className="pm-view-toggle" style={{ display: "flex", gap: 6 }}>
                <button
                    className={`pm-view-btn ${view === "table" ? "active" : ""}`}
                    onClick={() => onView("table")}
                    title="Table view"
                >
                    <List size={16} />
                </button>

                <button
                    className={`pm-view-btn ${view === "grid" ? "active" : ""}`}
                    onClick={() => onView("grid")}
                    title="Grid view"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>
        </div>
    );
}