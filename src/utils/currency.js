export function formatRupiah(amount) {
    if (amount == null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function parseRupiah(str) {
    return Number(String(str).replace(/[^0-9]/g, "")) || 0;
}