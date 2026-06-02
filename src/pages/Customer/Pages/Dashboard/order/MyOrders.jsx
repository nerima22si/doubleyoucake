import { useNavigate } from "react-router-dom";

import { useMyOrders } from "../../../../../hooks/useMyOrders";
import OrderCard from "../../../Component/OrderCard";
import OrderEmpty from "../../../Component/OrderEmpty";

const MyOrders = () => {
    const navigate = useNavigate();
    const { orders, loading } = useMyOrders(navigate);

    if (loading) {
        return (
            <>
                <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

                <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                    <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                        <div
                            className="
                            w-16
                            h-16
                            rounded-full
                            border-[5px]
                            border-[#EBD9C1]
                            border-t-[#4A2C2A]
                            animate-spin
                        "
                        />

                        <div className="text-center">
                            <h2 className="text-xl font-black text-[#4A2C2A]">
                                Memuat Riwayat Pesanan...
                            </h2>

                            <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                                Mohon tunggu sebentar
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF5] shadow rounded-2xl text-[#4A2C2A] px-6 py-10">
            <div className="max-w mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        Riwayat Pesanan
                    </h1>

                    <p className="text-[#6B4E4C] mt-3 font-medium">
                        Pantau status pesanan dan riwayat pembelianmu.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <OrderEmpty navigate={navigate} />
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;