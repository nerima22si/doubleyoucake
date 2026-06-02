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
        <div className="w-[420px] bg-white border border-[#E7DED7] rounded-3xl p-5 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] flex items-center justify-center text-[#8A5F41]">
                        <ShoppingBag />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-[#4A2C2A]">Cart</h2>
                        <p className="text-sm text-gray-400">{cart.length} item</p>
                    </div>
                </div>

                {cart.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-xs font-black text-red-500 hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-bold text-center">
                        Cart masih kosong
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="border border-[#E7DED7] rounded-2xl p-4">
                            <div className="flex justify-between gap-3">
                                <div>
                                    <h3 className="font-black text-[#4A2C2A]">{item.name}</h3>
                                    <p className="text-sm text-[#8A5F41] font-bold">
                                        {formatRupiah(item.price)}
                                    </p>
                                </div>

                                <button onClick={() => removeItem(item.id)} className="text-red-500">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQty(item.id, "minus")}
                                        className="w-9 h-9 rounded-xl bg-[#F6F1EC] flex items-center justify-center"
                                    >
                                        <Minus size={16} />
                                    </button>

                                    <div className="w-10 text-center font-black">
                                        {item.quantity}
                                    </div>

                                    <button
                                        onClick={() => updateQty(item.id, "plus")}
                                        className="w-9 h-9 rounded-xl bg-[#4A2C2A] text-white flex items-center justify-center"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <p className="font-black text-[#4A2C2A]">
                                    {formatRupiah(item.price * item.quantity)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="border-t border-[#E7DED7] pt-5 mt-5">
                <div className="space-y-2 text-sm mb-4">
                    <Row label="Subtotal" value={formatRupiah(subtotal)} />
                    <Row label="Tax" value={formatRupiah(tax)} />
                    <Row label="Total" value={formatRupiah(total)} bold />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onOpenBill}
                        disabled={cart.length === 0}
                        className="w-full bg-[#FDF5E6] hover:bg-[#F6E7C8] disabled:opacity-50 text-[#4A2C2A] py-3 rounded-2xl font-black"
                    >
                        Open Bill
                    </button>

                    <button
                        onClick={onPay}
                        disabled={cart.length === 0}
                        className="w-full bg-[#4A2C2A] hover:bg-[#3A211F] disabled:opacity-50 text-white py-3 rounded-2xl font-black"
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
        <div className="flex items-center justify-between">
            <span className={bold ? "font-black text-[#4A2C2A]" : "text-gray-500 font-semibold"}>
                {label}
            </span>
            <span className={bold ? "font-black text-[#4A2C2A]" : "font-bold"}>
                {value}
            </span>
        </div>
    );
}