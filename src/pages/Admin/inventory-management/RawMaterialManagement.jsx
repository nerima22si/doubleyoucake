import { useEffect, useMemo, useState } from "react";
import {
    Package,
    Search,
    Plus,
    SlidersHorizontal,
    Eye,
    AlertTriangle,
    MinusCircle,
    TrendingUp,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import {
    getStockStatus,
    formatAuditDateTime,
} from "./inventoryUtils";

import StockMoveMaterialModal from "./StockMoveMaterialModal";
import AppDialog from "../../../components/AppDialog";

export default function RawMaterialManagement() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [materialModal, setMaterialModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [stockModal, setStockModal] = useState({
        open: false,
        item: null,
        type: "IN",
    });

    const [dialog, setDialog] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
    });

    const showDialog = ({
        type = "info",
        title,
        message,
    }) => {
        setDialog({
            open: true,
            type,
            title,
            message,
        });
    };

    const closeDialog = () => {
        setDialog((prev) => ({
            ...prev,
            open: false,
        }));
    };

    useEffect(() => {
        fetchMaterials();

        const channel = supabase
            .channel("raw-materials-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "raw_materials",
                },
                () => fetchMaterials(false)
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "raw_material_logs",
                },
                () => fetchMaterials(false)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMaterials = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error } = await supabase
                .from("raw_materials")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) throw error;

            setMaterials(data || []);
        } catch (error) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Bahan Baku",
                message: error.message,
            });
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const filteredMaterials = useMemo(() => {
        const q = search.toLowerCase();

        return materials.filter((item) => {
            const name = item.name?.toLowerCase() || "";
            const unit = item.unit?.toLowerCase() || "";
            const status = getStockStatus(item).label.toLowerCase();

            return (
                name.includes(q) ||
                unit.includes(q) ||
                status.includes(q)
            );
        });
    }, [materials, search]);

    const stats = {
        total: materials.length,
        low: materials.filter(
            (m) => getStockStatus(m).label === "Low Stock"
        ).length,
        out: materials.filter(
            (m) => getStockStatus(m).label === "Out of Stock"
        ).length,
        over: materials.filter(
            (m) => getStockStatus(m).label === "Overstock"
        ).length,
    };

    const saveMaterial = async (payload) => {
        try {
            if (editing) {
                const { error } = await supabase
                    .from("raw_materials")
                    .update(payload)
                    .eq("id", editing.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("raw_materials")
                    .insert(payload);

                if (error) throw error;
            }

            setMaterialModal(false);
            setEditing(null);

            fetchMaterials(false);

            showDialog({
                type: "success",
                title: "Berhasil",
                message: editing
                    ? "Bahan baku berhasil diperbarui."
                    : "Bahan baku berhasil ditambahkan.",
            });
        } catch (error) {
            showDialog({
                type: "error",
                title: "Gagal Menyimpan",
                message: error.message,
            });
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-10 text-center font-bold text-gray-400">
                Loading raw material stock...
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MaterialStat
                        title="Total Materials"
                        value={stats.total}
                        icon={<Package size={22} />}
                    />

                    <MaterialStat
                        title="Low Stock"
                        value={stats.low}
                        icon={<AlertTriangle size={22} />}
                    />

                    <MaterialStat
                        title="Out of Stock"
                        value={stats.out}
                        icon={<MinusCircle size={22} />}
                    />

                    <MaterialStat
                        title="Overstock"
                        value={stats.over}
                        icon={<TrendingUp size={22} />}
                    />
                </div>

                <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5">
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-5">
                        <div className="flex-1 flex items-center gap-3 bg-[#FAFAFA] border border-[#E7DED7] rounded-2xl px-4 py-3">
                            <Search size={18} className="text-gray-400" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari bahan baku, unit, atau status..."
                                className="w-full bg-transparent outline-none text-sm font-semibold text-[#4A2C2A]"
                            />
                        </div>

                        <button
                            onClick={() => {
                                setEditing(null);
                                setMaterialModal(true);
                            }}
                            className="px-5 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Raw Material
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead>
                                <tr className="bg-[#FAFAFA] text-gray-500">
                                    <th className="text-left px-5 py-4 font-black">
                                        Bahan Baku
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Unit
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Current
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Min
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Max
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Reorder
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Status
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Created At
                                    </th>

                                    <th className="text-left px-5 py-4 font-black">
                                        Last Updated
                                    </th>

                                    <th className="text-right px-5 py-4 font-black">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredMaterials.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="px-5 py-10 text-center text-gray-400 font-bold"
                                        >
                                            Data bahan baku tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMaterials.map((item) => {
                                        const status = getStockStatus(item);

                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-t border-[#F3F3F3] hover:bg-[#FCFAF8]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] border border-[#E7DED7] flex items-center justify-center">
                                                            <Package size={20} />
                                                        </div>

                                                        <div>
                                                            <p className="font-black text-[#4A2C2A]">
                                                                {item.name}
                                                            </p>

                                                            <p className="text-xs text-gray-400 font-semibold">
                                                                Raw Material
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {item.unit}
                                                </td>

                                                <td className="px-5 py-4 font-black">
                                                    {item.current_stock}
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {item.min_stock}
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {item.max_stock}
                                                </td>

                                                <td className="px-5 py-4 font-semibold">
                                                    {item.reorder_point}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        style={{
                                                            background: status.bg,
                                                            color: status.color,
                                                        }}
                                                        className="px-3 py-1 rounded-full text-xs font-black"
                                                    >
                                                        {status.label}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-xs text-gray-500 font-bold whitespace-nowrap">
                                                    {formatAuditDateTime(item.created_at)}
                                                </td>

                                                <td className="px-5 py-4 text-xs text-gray-500 font-bold whitespace-nowrap">
                                                    {formatAuditDateTime(item.updated_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditing(item);
                                                                setMaterialModal(true);
                                                            }}
                                                            className="w-9 h-9 rounded-xl border border-[#E7DED7] bg-white flex items-center justify-center hover:bg-[#F6F1EC]"
                                                            title="Detail/Edit"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setStockModal({
                                                                    open: true,
                                                                    item,
                                                                    type: "IN",
                                                                })
                                                            }
                                                            className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100"
                                                            title="Restock"
                                                        >
                                                            <Plus size={16} />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setStockModal({
                                                                    open: true,
                                                                    item,
                                                                    type: "ADJUSTMENT",
                                                                })
                                                            }
                                                            className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center hover:bg-orange-100"
                                                            title="Adjustment"
                                                        >
                                                            <SlidersHorizontal size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <RawMaterialFormModal
                    open={materialModal}
                    editing={editing}
                    onClose={() => {
                        setMaterialModal(false);
                        setEditing(null);
                    }}
                    onSubmit={saveMaterial}
                />

                <StockMoveMaterialModal
                    open={stockModal.open}
                    item={stockModal.item}
                    type={stockModal.type}
                    onClose={() =>
                        setStockModal({
                            open: false,
                            item: null,
                            type: "IN",
                        })
                    }
                    onSuccess={() => {
                        fetchMaterials(false);

                        setStockModal({
                            open: false,
                            item: null,
                            type: "IN",
                        });
                    }}
                />
            </div>

            <AppDialog
                open={dialog.open}
                type={dialog.type}
                title={dialog.title}
                message={dialog.message}
                confirmText="Mengerti"
                onConfirm={closeDialog}
                onCancel={closeDialog}
            />
        </>
    );
}

function MaterialStat({ title, value, icon }) {
    return (
        <div className="bg-white border border-[#E7DED7] rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400 font-bold">
                        {title}
                    </p>

                    <h2 className="text-3xl font-black text-[#4A2C2A] mt-1">
                        {value}
                    </h2>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#F6F1EC] text-[#8A5F41] flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function RawMaterialFormModal({
    open,
    editing,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState({
        name: "",
        unit: "pcs",
        current_stock: 0,
        min_stock: 0,
        max_stock: 100,
        reorder_point: 0,
    });

    useEffect(() => {
        if (!open) return;

        if (editing) {
            setForm({
                name: editing.name || "",
                unit: editing.unit || "pcs",
                current_stock: editing.current_stock || 0,
                min_stock: editing.min_stock || 0,
                max_stock: editing.max_stock || 100,
                reorder_point: editing.reorder_point || 0,
            });
        } else {
            setForm({
                name: "",
                unit: "pcs",
                current_stock: 0,
                min_stock: 0,
                max_stock: 100,
                reorder_point: 0,
            });
        }
    }, [open, editing]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();

        if (!form.name.trim()) return;

        onSubmit({
            name: form.name.trim(),
            unit: form.unit,
            current_stock: Number(form.current_stock || 0),
            min_stock: Number(form.min_stock || 0),
            max_stock: Number(form.max_stock || 0),
            reorder_point: Number(form.reorder_point || 0),
        });
    };

    const setValue = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-[2rem] overflow-hidden">
                <div className="px-6 py-5 bg-[#4A2C2A] text-white">
                    <h2 className="text-xl font-black">
                        {editing
                            ? "Edit Raw Material"
                            : "Add Raw Material"}
                    </h2>

                    <p className="text-sm text-white/70">
                        Kelola stok bahan baku
                    </p>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <Input
                        label="Nama Bahan Baku"
                        value={form.name}
                        onChange={(e) =>
                            setValue("name", e.target.value)
                        }
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Unit"
                            value={form.unit}
                            onChange={(e) =>
                                setValue("unit", e.target.value)
                            }
                        />

                        <Input
                            label="Current Stock"
                            type="number"
                            value={form.current_stock}
                            onChange={(e) =>
                                setValue("current_stock", e.target.value)
                            }
                        />

                        <Input
                            label="Min Stock"
                            type="number"
                            value={form.min_stock}
                            onChange={(e) =>
                                setValue("min_stock", e.target.value)
                            }
                        />

                        <Input
                            label="Max Stock"
                            type="number"
                            value={form.max_stock}
                            onChange={(e) =>
                                setValue("max_stock", e.target.value)
                            }
                        />

                        <Input
                            label="Reorder Point"
                            type="number"
                            value={form.reorder_point}
                            onChange={(e) =>
                                setValue("reorder_point", e.target.value)
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-2xl border border-[#E7DED7] font-black"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-6 py-3 rounded-2xl bg-[#4A2C2A] text-white font-black"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div>
            <label className="text-sm font-black text-[#4A2C2A]">
                {label}
            </label>

            <input
                {...props}
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-[#E7DED7] outline-none font-semibold"
            />
        </div>
    );
}