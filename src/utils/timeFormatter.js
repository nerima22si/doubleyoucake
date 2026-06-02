export const fixSupabaseDate = (date) => {
    if (!date) return "";

    if (
        typeof date === "string" &&
        !date.endsWith("Z") &&
        !date.includes("+")
    ) {
        return `${date}Z`;
    }

    return date;
};

export const formatChatTime = (date) => {
    return new Date(fixSupabaseDate(date)).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
};

export const formatChatDate = (date) => {
    return new Date(fixSupabaseDate(date)).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    });
};

export const formatChatDateTime = (date) => {
    return new Date(fixSupabaseDate(date)).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
};

export const isSameChatDay = (date1, date2) => {
    const d1 = new Date(fixSupabaseDate(date1)).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
    });

    const d2 = new Date(fixSupabaseDate(date2)).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
    });

    return d1 === d2;
};