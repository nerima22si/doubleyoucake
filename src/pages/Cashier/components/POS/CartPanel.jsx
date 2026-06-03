import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function CartPanel({
    cart,
    subtotal,
    tax,
    total,
    updateQty,
    removeItem,
    clearCart,
    onPay,
    onOpenBill,
}) {
    return (
        <div className="w-full bg-white border border-[#E7DED7] rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-5 flex flex-col shrink-0 h-auto md:h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#F6F1EC] flex items-center justify-center text-[#8A5F41] shrink-0">
                        <ShoppingBag size={22} />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-[#4A2C2A]">
                            Cart
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-400">
                            {cart.length} item
                        </p>
                    </div>
                </div>

                {cart.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-xs font-black text-red-500 hover:underline shrink-0"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-0 sm:pr-1 min-h-[180px]">
                {cart.length === 0 ? (
                    <div className="min-h-[180px] md:h-full flex items-center justify-center text-gray-400 font-bold text-center text-sm">
                        Cart masih kosong
                    </div>
                ) : (
                    cart.map((item) => (
                        <div
                            key={item.id}
                            className="border border-[#E7DED7] rounded-2xl p-3 sm:p-4"
                        >
                            <div className="flex justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-black text-[#4A2C2A] text-sm sm:text-base line-clamp-2">
                                        {item.name}
                                    </h3>

                                    <p className="text-xs sm:text-sm text-[#8A5F41] font-bold mt-1">
                                        {formatRupiah(item.price)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-500 shrink-0"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQty(item.id, "minus")}
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F6F1EC] flex items-center justify-center"
                                    >
                                        <Minus size={16} />
                                    </button>

                                    <div className="w-9 sm:w-10 text-center font-black text-sm sm:text-base">
                                        {item.quantity}
                                    </div>

                                    <button
                                        onClick={() => updateQty(item.id, "plus")}
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#4A2C2A] text-white flex items-center justify-center"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <p className="font-black text-[#4A2C2A] text-sm sm:text-base sm:text-right">
                                    {formatRupiah(item.price * item.quantity)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-[#E7DED7] pt-4 sm:pt-5 mt-4 sm:mt-5">
                <div className="space-y-2 text-xs sm:text-sm mb-4">
                    <Row label="Subtotal" value={formatRupiah(subtotal)} />
                    <Row label="Tax" value={formatRupiah(tax)} />
                    <Row label="Total" value={formatRupiah(total)} bold />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 2xl:grid-cols-2 gap-3">
                    <button
                        onClick={onOpenBill}
                        disabled={cart.length === 0}
                        className="w-full bg-[#FDF5E6] hover:bg-[#F6E7C8] disabled:opacity-50 text-[#4A2C2A] py-3 rounded-2xl font-black text-sm"
                    >
                        Open Bill
                    </button>

                    <button
                        onClick={onPay}
                        disabled={cart.length === 0}
                        className="w-full bg-[#4A2C2A] hover:bg-[#3A211F] disabled:opacity-50 text-white py-3 rounded-2xl font-black text-sm"
                    >
                        Continue Payment
                    </button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, bold = false }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span
                className={
                    bold
                        ? "font-black text-[#4A2C2A]"
                        : "text-gray-500 font-semibold"
                }
            >
                {label}
            </span>

            <span
                className={
                    bold
                        ? "font-black text-[#4A2C2A] text-right"
                        : "font-bold text-right"
                }
            >
                {value}
            </span>
        </div>
    );
}