export default function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    order
}) {

    if (!open) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999
        }}>

            <div style={{
                width: 400,
                background: "#fff",
                borderRadius: 18,
                padding: 24
            }}>

                <h2>Hapus Order</h2>

                <p>
                    Yakin ingin menghapus order {order?.id}?
                </p>

                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 20
                }}>

                    <button onClick={onClose}>
                        Batal
                    </button>

                    <button onClick={onConfirm}>
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}