import { useMemo, useState } from "react";
import { CreditCard, QrCode, Wallet, X, Printer } from "lucide-react";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function PaymentModal({
    open,
    total,
    loading,
    onClose,
    onSubmit,
}) {
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cashReceived, setCashReceived] = useState("");

    const change = useMemo(() => {
        return Number(cashReceived || 0) - Number(total || 0);
    }, [cashReceived, total]);

    if (!open) return null;

    const submit = () => {
        if (paymentMethod === "cash" && Number(cashReceived || 0) < Number(total || 0)) {
            alert("Uang customer kurang");
            return;
        }

        onSubmit({
            paymentMethod,
            cashReceived:
                paymentMethod === "cash"
                    ? Number(cashReceived || 0)
                    : Number(total || 0),
            change:
                paymentMethod === "cash" && change > 0
                    ? change
                    : 0,
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="px-5 sm:px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-black">
                            Payment
                        </h2>

                        <p className="text-xs sm:text-sm text-white/70">
                            Complete customer payment
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-4">
                        <div className="flex justify-between gap-3 font-black text-base sm:text-lg text-[#4A2C2A]">
                            <span>Total</span>
                            <span className="text-right">
                                {formatRupiah(total)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-black text-[#4A2C2A]">
                            Payment Method
                        </label>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <PaymentButton
                                active={paymentMethod === "cash"}
                                onClick={() => setPaymentMethod("cash")}
                                icon={<Wallet size={18} />}
                                label="Cash"
                            />

                            <PaymentButton
                                active={paymentMethod === "qris"}
                                onClick={() => setPaymentMethod("qris")}
                                icon={<QrCode size={18} />}
                                label="QRIS"
                            />

                            <PaymentButton
                                active={paymentMethod === "transfer"}
                                onClick={() => setPaymentMethod("transfer")}
                                icon={<CreditCard size={18} />}
                                label="Transfer"
                            />
                        </div>
                    </div>

                    {paymentMethod === "cash" && (
                        <div>
                            <label className="text-sm font-black text-[#4A2C2A]">
                                Cash Received
                            </label>

                            <input
                                type="number"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="Masukkan nominal uang pelanggan"
                                className="mt-2 w-full h-12 sm:h-14 rounded-2xl border border-[#E7DED7] px-4 font-bold outline-none text-sm sm:text-base"
                            />

                            <div className="mt-3 bg-[#F6F1EC] rounded-2xl p-4">
                                <div className="flex justify-between gap-3 font-black text-[#4A2C2A] text-sm sm:text-base">
                                    <span>Change</span>
                                    <span className="text-right">
                                        {formatRupiah(change > 0 ? change : 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod !== "cash" && (
                        <div className="bg-[#F6F1EC] border border-[#E7DED7] rounded-2xl p-4">
                            <p className="text-sm font-bold text-[#4A2C2A]">
                                Pembayaran menggunakan{" "}
                                <span className="uppercase">
                                    {paymentMethod}
                                </span>
                            </p>

                            <p className="text-xs text-gray-500 mt-1 font-semibold">
                                Klik checkout jika pembayaran sudah dikonfirmasi.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={submit}
                        disabled={loading}
                        className="w-full h-12 sm:h-14 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center justify-center gap-3 disabled:opacity-50 text-sm sm:text-base hover:bg-[#3A211F]"
                    >
                        <Printer size={18} />
                        {loading ? "Processing..." : "Checkout & Print"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PaymentButton({ active, icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-13 sm:h-14 rounded-2xl flex flex-col items-center justify-center text-xs sm:text-sm font-black transition-all ${active
                    ? "bg-[#4A2C2A] text-white"
                    : "bg-[#F6F1EC] text-[#4A2C2A] hover:bg-[#EFE3D7]"
                }`}
        >
            {icon}

            <span className="text-[10px] sm:text-xs mt-1">
                {label}
            </span>
        </button>
    );
}