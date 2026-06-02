export default function OrderForm({
    open,
    form,
    setForm,
    onSubmit,
    onClose
}) {

    if (!open) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20
        }}>

            <div style={{
                width: "100%",
                maxWidth: 520,
                background: "#fff",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
            }}>

                {/* Header */}

                <div style={{
                    marginBottom: 20
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#111827"
                    }}>
                        Tambah Order
                    </h2>

                    <p style={{
                        marginTop: 6,
                        color: "#9ca3af",
                        fontSize: 13
                    }}>
                        Tambahkan data order baru
                    </p>
                </div>

                {/* Form */}

                <div style={{
                    display: "grid",
                    gap: 14
                }}>

                    <input
                        placeholder="Nama Customer"
                        value={form.customer}
                        onChange={(e) => setForm({
                            ...form,
                            customer: e.target.value
                        })}
                        style={inputStyle}
                    />

                    <input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({
                            ...form,
                            phone: e.target.value
                        })}
                        style={inputStyle}
                    />

                    <input
                        placeholder="Product"
                        value={form.product}
                        onChange={(e) => setForm({
                            ...form,
                            product: e.target.value
                        })}
                        style={inputStyle}
                    />

                    <input
                        type="date"
                        value={form.order_date}
                        onChange={(e) => setForm({
                            ...form,
                            order_date: e.target.value
                        })}
                        style={inputStyle}
                    />

                    <input
                        type="number"
                        placeholder="Total"
                        value={form.total}
                        onChange={(e) => setForm({
                            ...form,
                            total: e.target.value
                        })}
                        style={inputStyle}
                    />

                    <select
                        value={form.status}
                        onChange={(e) => setForm({
                            ...form,
                            status: e.target.value
                        })}
                        style={inputStyle}
                    >
                        <option>Masuk</option>
                        <option>Diproses</option>
                        <option>Selesai</option>
                        <option>Dibatalkan</option>
                    </select>

                    <textarea
                        placeholder="Catatan"
                        value={form.notes}
                        onChange={(e) => setForm({
                            ...form,
                            notes: e.target.value
                        })}
                        style={{
                            ...inputStyle,
                            minHeight: 90,
                            resize: "none"
                        }}
                    />

                </div>

                {/* Footer */}

                <div style={{
                    marginTop: 24,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10
                }}>

                    <button
                        onClick={onClose}
                        style={{
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            padding: "10px 18px",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 500
                        }}
                    >
                        Batal
                    </button>

                    <button
                        onClick={() => onSubmit(form)}
                        style={{
                            background: "#EA580C",
                            color: "#fff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 600
                        }}
                    >
                        Simpan
                    </button>

                </div>

            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14
};