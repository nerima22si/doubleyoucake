import React from "react";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function ThermalReceipt({
    orderId,
    cart,
    total,
    paymentMethod,
}) {
    return (
        <div
            id="thermal-receipt"
            className="hidden print:block w-[80mm] p-3 text-black bg-white"
        >
            <div className="text-center">
                <h1 className="font-bold text-lg">
                    Double You Cake
                </h1>

                <p className="text-xs">
                    Thermal Receipt
                </p>
            </div>

            <div className="border-t border-dashed my-2"></div>

            <div className="text-xs space-y-1">
                <div className="flex justify-between">
                    <span>Order</span>
                    <span>{orderId}</span>
                </div>

                <div className="flex justify-between">
                    <span>Payment</span>
                    <span>{paymentMethod}</span>
                </div>
            </div>

            <div className="border-t border-dashed my-2"></div>

            <div className="space-y-2">
                {cart.map((item) => (
                    <div key={item.id} className="text-xs">
                        <div className="flex justify-between gap-2">
                            <span>
                                {item.name} x{item.quantity}
                            </span>

                            <span>
                                {formatRupiah(
                                    item.price * item.quantity
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed my-2"></div>

            <div className="flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
            </div>

            <div className="mt-5 text-center text-xs">
                Terima kasih
            </div>
        </div>
    );
}