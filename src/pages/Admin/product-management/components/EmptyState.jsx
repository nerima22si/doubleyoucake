export default function EmptyState({ icon = "📦", title = "Tidak ada data", desc = "", action }) {
    return (
        <div className="pm-empty">
            <div className="pm-empty-icon">{icon}</div>
            <p className="pm-empty-title">{title}</p>
            {desc && <p className="pm-empty-desc">{desc}</p>}
            {action && (
                <button className="pm-btn pm-btn-primary" style={{ marginTop: 12 }} onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    );
}