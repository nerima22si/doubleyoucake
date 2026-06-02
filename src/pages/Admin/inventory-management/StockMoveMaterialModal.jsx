import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function StockMoveMaterialModal({
    open,
    item,
    type,
    onClose,
    onSuccess,
}) {
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setQuantity("");
            setNote("");
        }
    }, [open]);

    if (!open || !item) return null;

    const submit = async () => {
        const qty = Number(quantity);

        if (!qty || qty <= 0) {
            alert("Quantity harus lebih dari 0");
            return;
        }

        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const previousStock = Number(item.current_stock || 0);
            let newStock = previousStock;

            if (type === "IN") newStock = previousStock + qty;
            if (type === "OUT") newStock = previousStock - qty;
            if (type === "ADJUSTMENT") newStock = qty;

            if (newStock < 0) {
                alert("Stok tidak boleh minus");
                return;
            }

            const { error: updateError } = await supabase
                .from("raw_materials")
                .update({
                    current_stock: newStock,
                })
                .eq("id", item.id);

            if (updateError) throw updateError;

            const { error: logError } = await supabase
                .from("raw_material_logs")
                .insert({
                    raw_material_id: item.id,
                    type,
                    quantity: qty,
                    previous_stock: previousStock,
                    new_stock: newStock,
                    note,
                    created_by: user?.id || null,
                });

            if (logError) throw logError;

            onSuccess();
        } catch (error) {
            alert("Gagal update stok bahan baku: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] border border-[#E7DED7] shadow-2xl overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white">
                    <h2 className="text-xl font-black">
                        {type === "IN"
                            ? "Restock Bahan Baku"
                            : type === "OUT"
                                ? "Stock Out"
                                : "Adjustment Stock"}
                    </h2>
                    <p className="text-sm text-white/70">
                        {item.name}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-black">
                            {type === "ADJUSTMENT"
                                ? "Set New Stock"
                                : `Quantity (${item.unit})`}
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none"
                            placeholder="Masukkan jumlah"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-black">Catatan</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none"
                            placeholder="Contoh: pembelian tepung dari supplier"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-2xl border border-[#E7DED7] font-black"
                        >
                            Batal
                        </button>

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black disabled:opacity-50"
                        >
                            {loading ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}