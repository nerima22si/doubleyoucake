export function truncate(str, len = 50) {
    if (!str) return "—";
    return str.length > len ? str.slice(0, len) + "…" : str;
}

export function stockStatus(stock) {
    if (stock === 0) return { label: "Habis", color: "#EF4444", bg: "#FEF2F2" };
    if (stock <= 10) return { label: "Menipis", color: "#F97316", bg: "#FFF7ED" };
    return { label: "Tersedia", color: "#22C55E", bg: "#F0FDF4" };
}

export function getInitials(name = "") {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("");
}

export function slugify(str = "") {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}