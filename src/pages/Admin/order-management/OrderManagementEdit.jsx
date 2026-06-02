import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    User,
    Package,
    Calendar,
    DollarSign,
    FileText,
} from "lucide-react";

const PRIMARY = "#8A5F41";

const productOptions = [
    "Paket Basic B",
    "Paket Premium A",
    "Paket Ekstra C",
];

const statusOptions = ["Masuk", "Diproses", "Selesai", "Dibatalkan"];

const dummyOrders = [
    { id: "#ORD-0041", customer: "Rina Marlina", product: "Paket Premium A", date: "2026-04-27", total: "Rp 350.000", status: "Masuk", notes: "" },
    { id: "#ORD-0040", customer: "Budi Santoso", product: "Paket Basic B", date: "2026-04-27", total: "Rp 120.000", status: "Diproses", notes: "" },
];

export default function OrderManagementEdit() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [form, setForm] = useState({
        id: "",
        customer: "",
        product: "",
        date: "",
        total: "",
        status: "Masuk",
        notes: "",
    });

    useEffect(() => {
        const found = dummyOrders.find(o => o.id === orderId) || dummyOrders[0];
        setForm(found);
    }, [orderId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("UPDATE ORDER:", form);
        alert("Order berhasil diupdate");
        navigate("/management-order");
    };

    const input = {
        width: "100%",
        height: 44,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: "0 14px",
        fontSize: 13,
        outline: "none",
        background: "#fff",
    };

    const label = {
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6,
        display: "block",
    };

    return (
        <div style={{ padding: 28, background: "#f9fafb", minHeight: "100vh" }}>

            {/* HEADER */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 13,
                }}
            >
                <ArrowLeft size={16} />
                Kembali
            </button>

            <div style={{ marginTop: 16, marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                    Edit Order
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
                    Ubah detail order
                </p>
            </div>

            {/* CARD */}
            <form
                onSubmit={handleSubmit}
                style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    maxWidth: 600,
                }}
            >

                {/* ID */}
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>ID Order</label>
                    <input style={{ ...input, background: "#f3f4f6" }} value={form.id} disabled />
                </div>

                {/* CUSTOMER */}
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>
                        <User size={14} /> Nama Pelanggan
                    </label>
                    <input
                        name="customer"
                        value={form.customer}
                        onChange={handleChange}
                        style={input}
                    />
                </div>

                {/* PRODUCT */}
                <div style={{ marginBottom: 14 }}>
                    <label style={label}>
                        <Package size={14} /> Produk
                    </label>
                    <select
                        name="product"
                        value={form.product}
                        onChange={handleChange}
                        style={input}
                    >
                        {productOptions.map(p => (
                            <option key={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {/* GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                    <div>
                        <label style={label}>
                            <Calendar size={14} /> Tanggal
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            style={input}
                        />
                    </div>

                    <div>
                        <label style={label}>
                            <DollarSign size={14} /> Total
                        </label>
                        <input
                            name="total"
                            value={form.total}
                            onChange={handleChange}
                            style={input}
                        />
                    </div>
                </div>

                {/* STATUS */}
                <div style={{ marginTop: 14 }}>
                    <label style={label}>
                        <FileText size={14} /> Status
                    </label>
                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        style={input}
                    >
                        {statusOptions.map(s => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* NOTES */}
                <div style={{ marginTop: 14 }}>
                    <label style={label}>Catatan</label>
                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                        style={{ ...input, paddingTop: 10, height: "auto" }}
                        placeholder="Catatan..."
                    />
                </div>

                {/* BUTTONS */}
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 18
                }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "none",
                            background: PRIMARY,
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        <Save size={14} /> Simpan
                    </button>
                </div>

            </form>
        </div>
    );
}