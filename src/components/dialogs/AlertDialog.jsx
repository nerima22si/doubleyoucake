import { useEffect, useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

// ─── Animasi CSS ─────────────────────────────────────────

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    @keyframes ad-backdrop-in {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    @keyframes ad-card-in {
        from { opacity: 0; transform: scale(0.88) translateY(20px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes ad-card-out {
        from { opacity: 1; transform: scale(1) translateY(0); }
        to   { opacity: 0; transform: scale(0.88) translateY(20px); }
    }

    @keyframes ad-icon-shake {
        0%   { transform: rotate(0deg); }
        20%  { transform: rotate(-10deg); }
        40%  { transform: rotate(10deg); }
        60%  { transform: rotate(-6deg); }
        80%  { transform: rotate(6deg); }
        100% { transform: rotate(0deg); }
    }

    @keyframes ad-circle-pop {
        0%   { transform: scale(0); opacity: 0; }
        65%  { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }

    @keyframes ad-ring-pulse {
        0%   { transform: scale(1);   opacity: 0.7; }
        100% { transform: scale(1.9); opacity: 0; }
    }

    @keyframes ad-check-draw {
        from { stroke-dashoffset: 80; }
        to   { stroke-dashoffset: 0; }
    }

    @keyframes ad-fade-up {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes ad-progress {
        from { width: 100%; }
        to   { width: 0%; }
    }

    @keyframes ad-spin {
        to { transform: rotate(360deg); }
    }

    @keyframes ad-particle {
        0%   { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
    }

    .ad-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999;
        animation: ad-backdrop-in 0.2s ease forwards;
        font-family: 'Poppins', sans-serif;
    }

    .ad-card {
        background: #fff;
        border-radius: 24px;
        padding: 36px 32px 28px;
        width: 380px;
        max-width: calc(100vw - 32px);
        text-align: center;
        position: relative; overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06);
        animation: ad-card-in 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards;
    }

    .ad-card.closing { animation: ad-card-out 0.25s ease forwards; }

    .ad-card-danger::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, #DC2626, #EF4444, #FCA5A5);
        border-radius: 24px 24px 0 0;
    }

    .ad-card-success::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 4px;
        background: linear-gradient(90deg, #15803D, #22C55E, #86EFAC);
        border-radius: 24px 24px 0 0;
    }

    .ad-card-danger::after {
        content: '';
        position: absolute; bottom: -40px; right: -40px;
        width: 130px; height: 130px; border-radius: 50%;
        background: radial-gradient(circle, #FEF2F2 0%, transparent 70%);
    }

    .ad-card-success::after {
        content: '';
        position: absolute; bottom: -40px; right: -40px;
        width: 130px; height: 130px; border-radius: 50%;
        background: radial-gradient(circle, #F0FDF4 0%, transparent 70%);
    }

    .ad-close-btn {
        position: absolute; top: 14px; right: 14px;
        width: 28px; height: 28px; border-radius: 50%;
        border: 0.5px solid #e5e7eb; background: #f9fafb;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #9ca3af;
        transition: background 0.15s, color 0.15s;
        z-index: 1;
    }
    .ad-close-btn:hover { background: #f3f4f6; color: #374151; }

    .ad-icon-wrap {
        position: relative;
        width: 88px; height: 88px;
        margin: 0 auto 20px;
        display: flex; align-items: center; justify-content: center;
    }

    .ad-circle-danger {
        width: 80px; height: 80px; border-radius: 50%;
        background: linear-gradient(135deg, #FEF2F2, #FEE2E2);
        display: flex; align-items: center; justify-content: center;
        animation: ad-circle-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
        position: relative; z-index: 1;
    }

    .ad-circle-success {
        width: 80px; height: 80px; border-radius: 50%;
        background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
        display: flex; align-items: center; justify-content: center;
        animation: ad-circle-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
        position: relative; z-index: 1;
    }

    .ad-ring-danger {
        position: absolute; inset: 0; border-radius: 50%;
        border: 3px solid #EF4444;
        animation: ad-ring-pulse 1.2s ease-out 0.35s both;
    }

    .ad-ring-success {
        position: absolute; inset: 0; border-radius: 50%;
        border: 3px solid #22C55E;
        animation: ad-ring-pulse 1.2s ease-out 0.35s both;
    }

    .ad-icon-shake { animation: ad-icon-shake 0.5s ease 0.3s both; }

    .ad-check-path {
        stroke: #16A34A; stroke-width: 3;
        stroke-linecap: round; stroke-linejoin: round;
        fill: none;
        stroke-dasharray: 80; stroke-dashoffset: 80;
        animation: ad-check-draw 0.45s ease 0.4s forwards;
    }

    .ad-title {
        font-size: 19px; font-weight: 700;
        color: #111827; margin: 0 0 8px;
        animation: ad-fade-up 0.35s ease 0.2s both;
    }

    .ad-subtitle {
        font-size: 13px; color: #6b7280;
        margin: 0 0 8px; line-height: 1.65;
        animation: ad-fade-up 0.35s ease 0.25s both;
    }

    .ad-chip {
        display: inline-flex; align-items: center; gap: 6px;
        background: #f9fafb; border: 0.5px solid #e5e7eb;
        border-radius: 20px; padding: 5px 14px;
        font-size: 12px; font-weight: 600; color: #374151;
        margin-bottom: 24px;
        animation: ad-fade-up 0.35s ease 0.3s both;
    }

    .ad-chip-dot-red   { width:7px; height:7px; border-radius:50%; background:#EF4444; flex-shrink:0; }
    .ad-chip-dot-green { width:7px; height:7px; border-radius:50%; background:#22C55E; flex-shrink:0; }

    .ad-chips-wrap {
        display: flex; gap: 6px;
        flex-wrap: wrap; justify-content: center;
        margin-bottom: 24px;
        animation: ad-fade-up 0.35s ease 0.3s both;
    }

    .ad-btn-row {
        display: flex; gap: 10px;
        animation: ad-fade-up 0.35s ease 0.35s both;
    }

    .ad-btn-cancel {
        flex: 1; padding: 11px; border-radius: 12px;
        border: 0.5px solid #e5e7eb; background: #f9fafb;
        font-size: 13px; font-weight: 600; color: #374151;
        cursor: pointer; font-family: 'Poppins', sans-serif;
        transition: background 0.15s;
    }
    .ad-btn-cancel:hover { background: #f3f4f6; }

    .ad-btn-delete {
        flex: 1; padding: 11px; border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #DC2626, #EF4444);
        color: #fff; font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: 'Poppins', sans-serif;
        box-shadow: 0 4px 14px rgba(220,38,38,0.35);
        transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .ad-btn-delete:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(220,38,38,0.45);
    }
    .ad-btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

    .ad-btn-ok {
        width: 100%; padding: 12px; border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #15803D, #22C55E);
        color: #fff; font-size: 14px; font-weight: 600;
        cursor: pointer; font-family: 'Poppins', sans-serif;
        box-shadow: 0 4px 14px rgba(34,197,94,0.35);
        transition: transform 0.15s, box-shadow 0.15s;
        animation: ad-fade-up 0.35s ease 0.45s both;
    }
    .ad-btn-ok:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.45); }

    .ad-progress-wrap {
        height: 3px; background: #e5e7eb; border-radius: 10px;
        overflow: hidden; margin-bottom: 20px;
        animation: ad-fade-up 0.35s ease 0.4s both;
    }

    .ad-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #15803D, #22C55E);
        border-radius: 10px;
        animation: ad-progress 3s linear forwards;
    }

    .ad-spinner {
        width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: #fff; border-radius: 50%;
        animation: ad-spin 0.7s linear infinite;
    }

    .ad-particle {
        position: absolute; width: 7px; height: 7px;
        border-radius: 2px;
        animation: ad-particle 0.6s ease-out both;
    }
`;

// ─── Partikel merah ──────────────────────────────────────

const PARTICLES = [
    { color: "#EF4444", tx: "-28px", ty: "-30px", delay: "0.42s" },
    { color: "#FCA5A5", tx: "28px", ty: "-30px", delay: "0.44s" },
    { color: "#DC2626", tx: "-36px", ty: "10px", delay: "0.43s" },
    { color: "#EF4444", tx: "36px", ty: "10px", delay: "0.45s" },
    { color: "#FCA5A5", tx: "0px", ty: "-38px", delay: "0.46s" },
    { color: "#DC2626", tx: "-20px", ty: "32px", delay: "0.44s" },
    { color: "#EF4444", tx: "20px", ty: "32px", delay: "0.45s" },
];

// ─── KOMPONEN UTAMA ──────────────────────────────────────

/**
 * AlertDialog — komponen reusable untuk semua halaman
 *
 * Props:
 *  - open            : boolean   — tampilkan / sembunyikan
 *  - title           : string    — judul konfirmasi   (default: "Hapus Data Ini?")
 *  - subtitle        : string    — subjudul konfirmasi (default: pesan generik)
 *  - successTitle    : string    — judul setelah sukses (default: "Data Berhasil Dihapus!")
 *  - successSubtitle : string    — subjudul sukses      (default: pesan generik)
 *  - confirmLabel    : string    — label tombol hapus   (default: "Ya, Hapus")
 *  - chips           : array     — info yang ditampilkan, format: [{ label: "string" }, ...]
 *  - onConfirm       : async fn  — dipanggil saat user klik tombol konfirmasi
 *  - onClose         : function  — callback tutup dialog
 *
 * ─── Contoh pemakaian ────────────────────────────────────
 *
 * // Order
 * <AlertDialog
 *     open={alertOpen}
 *     title="Hapus Order Ini?"
 *     subtitle="Order yang dihapus tidak dapat dikembalikan."
 *     successTitle="Order Berhasil Dihapus!"
 *     successSubtitle="Data order telah dihapus dari database."
 *     confirmLabel="Ya, Hapus Order"
 *     chips={[{ label: deleteTarget?.id }, { label: deleteTarget?.customer }]}
 *     onConfirm={handleConfirmDelete}
 *     onClose={() => setAlertOpen(false)}
 * />
 *
 * // Produk
 * <AlertDialog
 *     open={alertOpen}
 *     title="Hapus Produk Ini?"
 *     subtitle="Stok dan data produk akan hilang permanen."
 *     successTitle="Produk Berhasil Dihapus!"
 *     successSubtitle="Produk telah dihapus dari katalog."
 *     confirmLabel="Ya, Hapus Produk"
 *     chips={[{ label: deleteTarget?.name }, { label: deleteTarget?.sku }]}
 *     onConfirm={handleConfirmDelete}
 *     onClose={() => setAlertOpen(false)}
 * />
 *
 * // Pelanggan
 * <AlertDialog
 *     open={alertOpen}
 *     title="Hapus Pelanggan Ini?"
 *     subtitle="Seluruh riwayat pelanggan akan ikut terhapus."
 *     successTitle="Pelanggan Berhasil Dihapus!"
 *     chips={[{ label: deleteTarget?.name }]}
 *     onConfirm={handleConfirmDelete}
 *     onClose={() => setAlertOpen(false)}
 * />
 */
export default function AlertDialog({
    open,
    title = "Hapus Data Ini?",
    subtitle = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.",
    successTitle = "Data Berhasil Dihapus!",
    successSubtitle = "Data telah dihapus secara permanen dari database.",
    confirmLabel = "Ya, Hapus",
    chips = [],
    onConfirm,
    onClose,
}) {
    const [phase, setPhase] = useState("confirm");
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    const [visible, setVisible] = useState(false);

    // Reset ke fase confirm setiap kali dialog dibuka
    useEffect(() => {
        if (open) {
            setPhase("confirm");
            setLoading(false);
            setClosing(false);
            setVisible(true);
        }
    }, [open]);

    // Auto-close 3 detik setelah sukses
    useEffect(() => {
        if (phase !== "success") return;
        const timer = setTimeout(() => handleClose(), 3000);
        return () => clearTimeout(timer);
    }, [phase]);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setVisible(false);
            setClosing(false);
            onClose?.();
        }, 240);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm?.();
            setPhase("success");
        } catch (err) {
            console.error("Action error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Normalisasi chips — filter yang kosong
    const validChips = chips.filter(c => c?.label);

    if (!visible) return null;

    return (
        <>
            <style>{STYLES}</style>

            <div
                className="ad-backdrop"
                onClick={(e) => {
                    if (e.target === e.currentTarget && !loading)
                        handleClose();
                }}
            >
                <div
                    className={`ad-card ${phase === "success" ? "ad-card-success" : "ad-card-danger"
                        } ${closing ? "closing" : ""}`}
                >

                    {/* Tombol X */}
                    {!loading && (
                        <button className="ad-close-btn" onClick={handleClose}>
                            <X size={13} />
                        </button>
                    )}

                    {/* ════ FASE KONFIRMASI ════ */}
                    {phase === "confirm" && (
                        <>
                            <div className="ad-icon-wrap">
                                <div className="ad-ring-danger" />
                                <div className="ad-circle-danger">
                                    <div className="ad-icon-shake">
                                        <AlertTriangle size={34} color="#DC2626" strokeWidth={2.2} />
                                    </div>
                                </div>

                                {PARTICLES.map((p, i) => (
                                    <div
                                        key={i}
                                        className="ad-particle"
                                        style={{
                                            background: p.color,
                                            "--tx": p.tx, "--ty": p.ty,
                                            animationDelay: p.delay,
                                            top: "50%", left: "50%",
                                            marginTop: "-3.5px", marginLeft: "-3.5px",
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Teks dinamis */}
                            <h2 className="ad-title">{title}</h2>
                            <p className="ad-subtitle">{subtitle}</p>

                            {/* Chips info dinamis */}
                            {validChips.length > 0 && (
                                <div className="ad-chips-wrap">
                                    {validChips.map((chip, i) => (
                                        <span key={i} className="ad-chip">
                                            <span className="ad-chip-dot-red" />
                                            {chip.label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="ad-btn-row">
                                <button
                                    className="ad-btn-cancel"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    Batal
                                </button>

                                <button
                                    className="ad-btn-delete"
                                    onClick={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="ad-spinner" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            {confirmLabel}
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ════ FASE SUKSES ════ */}
                    {phase === "success" && (
                        <>
                            <div className="ad-icon-wrap">
                                <div className="ad-ring-success" />
                                <div className="ad-circle-success">
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                        <path className="ad-check-path" d="M10 21 L17 28 L30 13" />
                                    </svg>
                                </div>
                            </div>

                            {/* Teks dinamis */}
                            <h2 className="ad-title">{successTitle}</h2>
                            <p className="ad-subtitle">{successSubtitle}</p>

                            {/* Chips info (warna hijau) */}
                            {validChips.length > 0 && (
                                <div className="ad-chips-wrap">
                                    {validChips.map((chip, i) => (
                                        <span key={i} className="ad-chip">
                                            <span className="ad-chip-dot-green" />
                                            {chip.label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Progress bar auto-close */}
                            <div className="ad-progress-wrap">
                                <div className="ad-progress-bar" />
                            </div>

                            <button className="ad-btn-ok" onClick={handleClose}>
                                Oke, Mengerti!
                            </button>
                        </>
                    )}

                </div>
            </div>
        </>
    );
}