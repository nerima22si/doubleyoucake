import { useNavigate } from "react-router-dom";
import { useMyOrders } from "../../../../../hooks/useMyOrders";
import OrderCard from "../../../Component/OrderCard";
import OrderEmpty from "../../../Component/OrderEmpty";

const MyOrders = () => {
    const navigate = useNavigate();
    const { orders, loading } = useMyOrders(navigate);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
                <div className="bg-white border border-[#EBD9C1] rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-10 py-8 sm:py-12 flex flex-col items-center gap-4 sm:gap-5 shadow-xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-[4px] sm:border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />

                    <div className="text-center">
                        <h2 className="text-base sm:text-xl font-black text-[#4A2C2A]">
                            Memuat Riwayat Pesanan...
                        </h2>

                        <p className="text-xs sm:text-sm font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFBF5] shadow rounded-2xl text-[#4A2C2A] px-3 sm:px-5 lg:px-6 py-5 sm:py-8 lg:py-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 sm:mb-8 lg:mb-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight">
                        Riwayat Pesanan
                    </h1>

                    <p className="text-[#6B4E4C] mt-2 sm:mt-3 font-medium text-xs sm:text-sm lg:text-base">
                        Pantau status pesanan dan riwayat pembelianmu.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <OrderEmpty navigate={navigate} />
                ) : (
                    <div className="space-y-3 sm:space-y-5 lg:space-y-6">
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