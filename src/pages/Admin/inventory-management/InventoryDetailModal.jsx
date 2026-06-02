import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { formatDateTime, getStockStatus } from "./inventoryUtils";

export default function InventoryDetailModal({ item, onClose, onRestock }) {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!item?.id) return;
        fetchLogs();
    }, [item?.id]);

    const fetchLogs = async () => {
        const { data } = await supabase
            .from("inventory_logs")
            .select("*")
            .eq("inventory_id", item.id)
            .order("created_at", { ascending: false });

        setLogs(data || []);
    };

    if (!item) return null;

    const status = getStockStatus(item);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-[2rem] border border-[#E7DED7] shadow-2xl overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black">
                            {item.products?.name || "Detail Stok"}
                        </h2>
                        <p className="text-sm text-white/70">
                            Inventory Detail
                        </p>
                    </div>

                    <button onClick={onClose} className="font-black">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        <MiniBox label="Current" value={item.current_stock} />
                        <MiniBox label="Min" value={item.min_stock} />
                        <MiniBox label="Max" value={item.max_stock} />
                        <MiniBox label="Reorder" value={item.reorder_point} />
                        <MiniBox label="Status" value={status.label} />
                    </div>

                    <button
                        onClick={() => onRestock(item)}
                        className="mb-6 px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black"
                    >
                        + Restock Barang
                    </button>

                    <h3 className="font-black text-[#4A2C2A] mb-3">
                        Riwayat Stok
                    </h3>

                    <div className="max-h-72 overflow-y-auto border border-[#E7DED7] rounded-2xl">
                        {logs.length === 0 ? (
                            <p className="p-5 text-center text-gray-400 font-bold">
                                Belum ada riwayat stok.
                            </p>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 border-b border-[#F3F3F3] last:border-b-0"
                                >
                                    <div className="flex justify-between">
                                        <p className="font-black">
                                            {log.type} — {log.quantity}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatDateTime(log.created_at)}
                                        </p>
                                    </div>

                                    <p className="text-sm text-gray-500 mt-1">
                                        {log.previous_stock} → {log.new_stock}
                                    </p>

                                    {log.note && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Catatan: {log.note}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniBox({ label, value }) {
    return (
        <div className="bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-bold">{label}</p>
            <p className="text-lg font-black text-[#4A2C2A] mt-1">{value}</p>
        </div>
    );
}