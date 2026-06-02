// src/components/dialogs/SuccessDialog.jsx

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────
// STYLE
// ─────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

@keyframes sd-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes sd-card-in {
    from {
        opacity: 0;
        transform: scale(.85) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes sd-check-draw {
    from { stroke-dashoffset: 80; }
    to   { stroke-dashoffset: 0; }
}

@keyframes sd-circle-pop {
    0% {
        transform: scale(0);
        opacity: 0;
    }
    70% {
        transform: scale(1.12);
        opacity: 1;
    }
    100% {
        transform: scale(1);
    }
}

.sd-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(4px);
    z-index: 9999;

    display: flex;
    align-items: center;
    justify-content: center;

    animation: sd-backdrop-in .25s ease forwards;

    font-family: 'Poppins', sans-serif;
}

.sd-card {
    width: 360px;
    max-width: calc(100vw - 32px);

    background: white;
    border-radius: 24px;

    padding: 34px 28px;

    position: relative;
    overflow: hidden;

    box-shadow:
        0 20px 50px rgba(0,0,0,.12),
        0 4px 18px rgba(0,0,0,.06);

    animation: sd-card-in .35s cubic-bezier(.34,1.56,.64,1) forwards;
}

.sd-card::before {
    content: '';
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 5px;

    background:
        linear-gradient(
            90deg,
            #EA580C,
            #F97316,
            #FB923C
        );
}

.sd-icon-wrap {
    position: relative;

    width: 90px;
    height: 90px;

    margin: 0 auto 22px;

    display: flex;
    align-items: center;
    justify-content: center;
}

.sd-circle {
    width: 80px;
    height: 80px;

    border-radius: 999px;

    background:
        linear-gradient(
            135deg,
            #FFF7ED,
            #FFEDD5
        );

    display: flex;
    align-items: center;
    justify-content: center;

    animation:
        sd-circle-pop .5s cubic-bezier(.34,1.56,.64,1) .1s both;
}

.sd-checkmark {
    width: 40px;
    height: 40px;
}

.sd-check-path {
    stroke: #EA580C;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;

    stroke-dasharray: 80;
    stroke-dashoffset: 80;

    animation:
        sd-check-draw .5s ease .4s forwards;
}

.sd-title {
    margin: 0 0 8px;

    text-align: center;

    font-size: 22px;
    font-weight: 700;

    color: #111827;
}

.sd-subtitle {
    margin: 0;

    text-align: center;

    font-size: 13px;
    line-height: 1.6;

    color: #6b7280;
}

.sd-meta {
    margin-top: 24px;

    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

.sd-chip {
    border: 1px solid #e5e7eb;
    background: #f9fafb;

    border-radius: 999px;

    padding: 6px 12px;

    font-size: 12px;
    color: #374151;
    font-weight: 500;
}

.sd-btn {
    width: 100%;

    height: 46px;

    margin-top: 28px;

    border: none;
    border-radius: 14px;

    background:
        linear-gradient(
            135deg,
            #EA580C,
            #F97316
        );

    color: white;

    font-size: 14px;
    font-weight: 600;

    cursor: pointer;

    transition: .2s;
}

.sd-btn:hover {
    transform: translateY(-1px);
}
`;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function SuccessDialog({

    open,

    title = "Berhasil!",

    message = "Data berhasil disimpan.",

    buttonText = "Oke",

    data = [],

    autoClose = false,

    autoCloseDelay = 2500,

    onClose,

}) {

    const [visible, setVisible] = useState(open);

    useEffect(() => {

        if (open) {

            setVisible(true);

            if (autoClose) {

                const timer = setTimeout(() => {
                    handleClose();
                }, autoCloseDelay);

                return () => clearTimeout(timer);
            }
        }

    }, [open]);

    if (!visible) return null;

    const handleClose = () => {

        setVisible(false);

        onClose?.();

    };

    return (
        <>
            <style>{STYLES}</style>

            <div
                className="sd-backdrop"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        handleClose();
                    }
                }}
            >

                <div className="sd-card">

                    {/* ICON */}

                    <div className="sd-icon-wrap">

                        <div className="sd-circle">

                            <svg
                                className="sd-checkmark"
                                viewBox="0 0 40 40"
                            >
                                <path
                                    className="sd-check-path"
                                    d="M10 21 L17 28 L30 13"
                                />
                            </svg>

                        </div>

                    </div>

                    {/* TITLE */}

                    <h2 className="sd-title">
                        {title}
                    </h2>

                    {/* MESSAGE */}

                    <p className="sd-subtitle">
                        {message}
                    </p>

                    {/* META */}

                    {data.length > 0 && (
                        <div className="sd-meta">

                            {data.map((item, index) => (

                                <div
                                    key={index}
                                    className="sd-chip"
                                >
                                    {item}
                                </div>

                            ))}

                        </div>
                    )}

                    {/* BUTTON */}

                    <button
                        className="sd-btn"
                        onClick={handleClose}
                    >
                        {buttonText}
                    </button>

                </div>

            </div>
        </>
    );
}