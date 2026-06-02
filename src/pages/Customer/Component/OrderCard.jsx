import { ChevronRight } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";

const OrderCard = ({ order, navigate }) => {
    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-[#EBD9C1]/70 hover:shadow-lg transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
                <div>
                    <h2 className="text-2xl font-black">{order.id}</h2>

                    <p className="text-slate-500 font-medium mt-1">
                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>

                <OrderStatusBadge status={order.status} />
            </div>

            <div className="space-y-4">
                {order.order_items?.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                        <img
                            src={item.products?.image_url}
                            alt={item.products?.name}
                            className="w-20 h-20 rounded-2xl object-cover bg-[#FDF5E6]"
                        />

                        <div className="flex-1">
                            <h3 className="font-black">{item.products?.name}</h3>

                            <p className="text-sm text-slate-500 font-bold mt-1">
                                Qty: {item.qty}
                            </p>
                        </div>

                        <div className="font-black text-[#8B5E3C]">
                            {formatRupiah(item.price * item.qty)}
                        </div>
                    </div>
                ))}
            </div>

            {order.order_items?.length > 2 && (
                <p className="text-sm text-slate-400 font-bold mt-4">
                    +{order.order_items.length - 2} produk lainnya
                </p>
            )}

            <div className="border-t border-[#EBD9C1] mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                    <p className="text-sm text-slate-500 font-bold">
                        Total Pembayaran
                    </p>

                    <h3 className="text-2xl font-black text-[#8B5E3C] mt-1">
                        {formatRupiah(order.total_price)}
                    </h3>
                </div>

                <button
                    onClick={() => navigate(`/customer/my-orders/${order.id}`)}
                    className="px-8 py-4 rounded-full bg-[#4A2C2A] text-white font-black hover:bg-[#8B5E3C] transition-all flex items-center justify-center gap-2"
                >
                    Lihat Detail
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default OrderCard;