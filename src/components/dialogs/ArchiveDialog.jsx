import { useEffect, useState } from "react";
import {
    Archive,
    ArchiveRestore,
    Package,
    X
} from "lucide-react";

// ─── Styles ──────────────────────────────────────────────

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    @keyframes ar-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes ar-card-in {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes ar-card-out {
        from {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
        to {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
        }
    }

    @keyframes ar-pop {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        70% {
            transform: scale(1.08);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes ar-pulse {
        0% {
            transform: scale(1);
            opacity: 0.7;
        }
        100% {
            transform: scale(1.8);
            opacity: 0;
        }
    }

    @keyframes ar-progress {
        from { width: 100%; }
        to { width: 0%; }
    }

    .ar-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(4px);

        display: flex;
        align-items: center;
        justify-content: center;

        animation: ar-backdrop-in .2s ease forwards;

        font-family: 'Poppins', sans-serif;
    }

    .ar-card {
        width: 390px;
        max-width: calc(100vw - 30px);

        background: #fff;
        border-radius: 24px;

        padding: 34px 30px 28px;

        position: relative;
        overflow: hidden;

        box-shadow:
            0 24px 60px rgba(0,0,0,0.12),
            0 6px 18px rgba(0,0,0,0.08);

        animation: ar-card-in .28s cubic-bezier(.34,1.4,.64,1) forwards;
    }

    .ar-card.closing {
        animation: ar-card-out .22s ease forwards;
    }

    .ar-card.archive::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;

        background:
            linear-gradient(
                90deg,
                #EA580C,
                #FB923C,
                #FDBA74
            );
    }

    .ar-card.restore::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;

        background:
            linear-gradient(
                90deg,
                #2563EB,
                #60A5FA,
                #BFDBFE
            );
    }

    .ar-close {
        position: absolute;
        top: 14px;
        right: 14px;

        width: 28px;
        height: 28px;

        border-radius: 50%;

        border: .5px solid #e5e7eb;
        background: #f9fafb;

        display: flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        color: #9ca3af;
    }

    .ar-close:hover {
        background: #f3f4f6;
        color: #374151;
    }

    .ar-icon-wrap {
        position: relative;

        width: 88px;
        height: 88px;

        margin: 0 auto 22px;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ar-circle {
        width: 80px;
        height: 80px;

        border-radius: 50%;

        display: flex;
        align-items: center;
        justify-content: center;

        position: relative;
        z-index: 2;

        animation: ar-pop .45s cubic-bezier(.34,1.56,.64,1) .08s both;
    }

    .ar-circle.archive {
        background:
            linear-gradient(
                135deg,
                #FFF7ED,
                #FFEDD5
            );
    }

    .ar-circle.restore {
        background:
            linear-gradient(
                135deg,
                #EFF6FF,
                #DBEAFE
            );
    }

    .ar-ring {
        position: absolute;
        inset: 0;

        border-radius: 50%;

        animation: ar-pulse 1.2s ease-out .25s both;
    }

    .ar-ring.archive {
        border: 3px solid #EA580C;
    }

    .ar-ring.restore {
        border: 3px solid #3B82F6;
    }

    .ar-title {
        font-size: 20px;
        font-weight: 700;
        color: #111827;

        margin: 0 0 8px;

        text-align: center;
    }

    .ar-subtitle {
        font-size: 13px;
        color: #6b7280;

        line-height: 1.7;

        margin: 0 0 22px;

        text-align: center;
    }

    .ar-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        padding: 5px 14px;

        border-radius: 20px;

        background: #f9fafb;
        border: .5px solid #e5e7eb;

        font-size: 12px;
        font-weight: 600;
        color: #374151;
    }

    .ar-chip-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
    }

    .ar-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
    }

    .ar-dot.archive {
        background: #EA580C;
    }

    .ar-dot.restore {
        background: #3B82F6;
    }

    .ar-actions {
        display: flex;
        gap: 10px;
    }

    .ar-btn-cancel {
        flex: 1;

        padding: 11px;

        border-radius: 12px;

        border: .5px solid #e5e7eb;
        background: #f9fafb;

        font-size: 13px;
        font-weight: 600;

        cursor: pointer;
    }

    .ar-btn-confirm {
        flex: 1;

        padding: 11px;

        border-radius: 12px;

        border: none;

        color: #fff;

        font-size: 13px;
        font-weight: 600;

        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .ar-btn-confirm.archive {
        background:
            linear-gradient(
                135deg,
                #EA580C,
                #FB923C
            );
    }

    .ar-btn-confirm.restore {
        background:
            linear-gradient(
                135deg,
                #2563EB,
                #60A5FA
            );
    }

    .ar-progress-wrap {
        height: 3px;
        background: #e5e7eb;

        border-radius: 10px;

        overflow: hidden;

        margin-bottom: 20px;
    }

    .ar-progress-bar {
        height: 100%;
        animation: ar-progress 3s linear forwards;
    }

    .ar-progress-bar.archive {
        background:
            linear-gradient(
                90deg,
                #EA580C,
                #FB923C
            );
    }

    .ar-progress-bar.restore {
        background:
            linear-gradient(
                90deg,
                #2563EB,
                #60A5FA
            );
    }

    .ar-btn-ok {
        width: 100%;

        padding: 12px;

        border-radius: 12px;

        border: none;

        color: #fff;

        font-size: 14px;
        font-weight: 600;

        cursor: pointer;
    }

    .ar-btn-ok.archive {
        background:
            linear-gradient(
                135deg,
                #EA580C,
                #FB923C
            );
    }

    .ar-btn-ok.restore {
        background:
            linear-gradient(
                135deg,
                #2563EB,
                #60A5FA
            );
    }
`;

// ─── Component ───────────────────────────────────────────

export default function ArchiveDialog({
    open,
    archived = false,
    productName = "",
    onConfirm,
    onClose
}) {

    const [phase, setPhase] =
        useState("confirm");

    const [visible, setVisible] =
        useState(false);

    const [closing, setClosing] =
        useState(false);

    useEffect(() => {

        if (open) {
            setPhase("confirm");
            setVisible(true);
            setClosing(false);
        }

    }, [open]);

    useEffect(() => {

        if (phase !== "success") return;

        const timer = setTimeout(() => {
            handleClose();
        }, 3000);

        return () => clearTimeout(timer);

    }, [phase]);

    const handleClose = () => {

        setClosing(true);

        setTimeout(() => {

            setVisible(false);
            setClosing(false);

            onClose?.();

        }, 220);
    };

    const handleConfirm = async () => {

        await onConfirm?.();

        setPhase("success");
    };

    if (!visible) return null;

    const mode =
        archived ? "restore" : "archive";

    return (
        <>
            <style>{STYLES}</style>

            <div
                className="ar-backdrop"
                onClick={(e) => {
                    if (e.target === e.currentTarget)
                        handleClose();
                }}
            >

                <div className={`ar-card ${mode} ${closing ? "closing" : ""}`}>

                    <button
                        className="ar-close"
                        onClick={handleClose}
                    >
                        <X size={13} />
                    </button>

                    {/* CONFIRM */}

                    {phase === "confirm" && (
                        <>

                            <div className="ar-icon-wrap">

                                <div className={`ar-ring ${mode}`} />

                                <div className={`ar-circle ${mode}`}>

                                    {archived ? (
                                        <ArchiveRestore
                                            size={34}
                                            color="#2563EB"
                                        />
                                    ) : (
                                        <Archive
                                            size={34}
                                            color="#EA580C"
                                        />
                                    )}

                                </div>

                            </div>

                            <h2 className="ar-title">
                                {archived
                                    ? "Pulihkan Produk?"
                                    : "Arsipkan Produk?"
                                }
                            </h2>

                            <p className="ar-subtitle">
                                {archived
                                    ? "Produk akan dipulihkan dan muncul kembali di daftar aktif."
                                    : "Produk akan disembunyikan dari daftar aktif dan dipindahkan ke arsip."
                                }
                            </p>

                            <div className="ar-chip-wrap">
                                <span className="ar-chip">
                                    <span className={`ar-dot ${mode}`} />
                                    <Package size={12} />
                                    {productName}
                                </span>
                            </div>

                            <div className="ar-actions">

                                <button
                                    className="ar-btn-cancel"
                                    onClick={handleClose}
                                >
                                    Batal
                                </button>

                                <button
                                    className={`ar-btn-confirm ${mode}`}
                                    onClick={handleConfirm}
                                >
                                    {archived ? (
                                        <>
                                            <ArchiveRestore size={14} />
                                            Pulihkan
                                        </>
                                    ) : (
                                        <>
                                            <Archive size={14} />
                                            Arsipkan
                                        </>
                                    )}
                                </button>

                            </div>

                        </>
                    )}

                    {/* SUCCESS */}

                    {phase === "success" && (
                        <>

                            <div className="ar-icon-wrap">

                                <div className={`ar-ring ${mode}`} />

                                <div className={`ar-circle ${mode}`}>

                                    {archived ? (
                                        <ArchiveRestore
                                            size={34}
                                            color="#2563EB"
                                        />
                                    ) : (
                                        <Archive
                                            size={34}
                                            color="#EA580C"
                                        />
                                    )}

                                </div>

                            </div>

                            <h2 className="ar-title">
                                {archived
                                    ? "Produk Dipulihkan!"
                                    : "Produk Diarsipkan!"
                                }
                            </h2>

                            <p className="ar-subtitle">
                                {archived
                                    ? "Produk berhasil dipulihkan ke daftar aktif."
                                    : "Produk berhasil dipindahkan ke arsip."
                                }
                            </p>

                            <div className="ar-chip-wrap">
                                <span className="ar-chip">
                                    <span className={`ar-dot ${mode}`} />
                                    {productName}
                                </span>
                            </div>

                            <div className="ar-progress-wrap">
                                <div className={`ar-progress-bar ${mode}`} />
                            </div>

                            <button
                                className={`ar-btn-ok ${mode}`}
                                onClick={handleClose}
                            >
                                Oke, Mengerti!
                            </button>

                        </>
                    )}

                </div>

            </div>
        </>
    );
}