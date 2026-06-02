import { Eye, Pencil, Trash2 } from "lucide-react";

export default function OrderManagementCard({
    order,
    badge,
    onView,
    onEdit,
    onDelete
}) {

    return (
        <div style={{
            background: "#fff",
            borderRadius: 16,
            border: "0.5px solid #e5e7eb",
            padding: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        }}>

            <div>
                <h3 style={{ margin: 0 }}>
                    {order.customer}
                </h3>

                <p style={{ color: "#6b7280" }}>
                    {order.product}
                </p>

                {badge}
            </div>

            <div style={{
                display: "flex",
                gap: 8
            }}>

                <button onClick={onView}>
                    <Eye size={16} />
                </button>

                <button onClick={onEdit}>
                    <Pencil size={16} />
                </button>

                <button onClick={onDelete}>
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}