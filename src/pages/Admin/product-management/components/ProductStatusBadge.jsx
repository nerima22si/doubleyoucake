export default function ProductStatusBadge({ status }) {
    const map = {
        published: {
            label: "Published",
            bg: "#ECFDF3",
            color: "#027A48",
        },
        draft: {
            label: "Draft",
            bg: "#FFF7ED",
            color: "#C2410C",
        },
        archived: {
            label: "Archived",
            bg: "#F2F4F7",
            color: "#667085",
        },
    };

    const item = map[status] || map.published;

    return (
        <span
            style={{
                background: item.bg,
                color: item.color,
            }}
            className="px-3 py-1 rounded-full text-xs font-black"
        >
            {item.label}
        </span>
    );
}