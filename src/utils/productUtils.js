export const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));
};

export const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });
};

export const truncate = (text, max = 50) => {
    if (!text) return "";
    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;
};

export const getProductStats = (products = []) => {
    return {
        total: products.length,
        published: products.filter(
            (product) => product.product_status === "published"
        ).length,
        draft: products.filter((product) => product.product_status === "draft")
            .length,
        archived: products.filter(
            (product) => product.product_status === "archived"
        ).length,
    };
};