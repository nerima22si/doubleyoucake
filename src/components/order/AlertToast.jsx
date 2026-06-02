export default function AlertToast({
    type = "success",
    message,
    show
}) {

    if (!show) return null;

    const bg = type === "success"
        ? "#dcfce7"
        : "#fee2e2";

    const color = type === "success"
        ? "#15803d"
        : "#b91c1c";

    return (
        <div style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: bg,
            color,
            padding: "12px 18px",
            borderRadius: 12,
            zIndex: 999,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)"
        }}>
            {message}
        </div>
    );
}