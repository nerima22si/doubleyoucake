export const getStockStatus = (item) => {
    const stock = Number(item.current_stock || 0);
    const reorder = Number(item.reorder_point || 0);
    const max = Number(item.max_stock || 0);

    if (stock <= 0) {
        return {
            label: "Out of Stock",
            bg: "#FEF2F2",
            color: "#B91C1C",
        };
    }

    if (stock <= reorder) {
        return {
            label: "Low Stock",
            bg: "#FFF7ED",
            color: "#C2410C",
        };
    }

    if (stock >= max) {
        return {
            label: "Overstock",
            bg: "#EFF6FF",
            color: "#1D4ED8",
        };
    }

    return {
        label: "In Stock",
        bg: "#F0FDF4",
        color: "#15803D",
    };
};

export const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
};
export const formatAuditDateTime = (date) => {
    if (!date) return "-";

    const fixedDate =
        typeof date === "string" &&
            !date.endsWith("Z") &&
            !date.includes("+")
            ? `${date}Z`
            : date;

    return new Date(fixedDate).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
};