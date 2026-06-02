import { Clock3, Package, CheckCircle2, XCircle } from "lucide-react";

const statusMap = {
    Masuk: {
        label: "Masuk",
        className: "bg-orange-100 text-orange-700",
        icon: <Clock3 size={16} />,
    },
    Diproses: {
        label: "Diproses",
        className: "bg-blue-100 text-blue-700",
        icon: <Package size={16} />,
    },
    Selesai: {
        label: "Selesai",
        className: "bg-green-100 text-green-700",
        icon: <CheckCircle2 size={16} />,
    },
    Dibatalkan: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-700",
        icon: <XCircle size={16} />,
    },
};

const OrderStatusBadge = ({ status }) => {
    const current = statusMap[status] || statusMap.Masuk;

    return (
        <div
            className={`flex items-center gap-2 px-5 py-3 rounded-full w-fit font-black text-sm ${current.className}`}
        >
            {current.icon}
            {current.label}
        </div>
    );
};

export default OrderStatusBadge;