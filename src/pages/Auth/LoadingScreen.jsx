import { CakeSlice } from "lucide-react";

export default function LoadingScreen({
    text = "Memuat halaman...",
}) {
    return (
        <div style={styles.container}>
            <div style={styles.card}>

                <div style={styles.iconWrapper}>
                    <CakeSlice size={34} color="#C2410C" />
                </div>

                <div style={styles.spinner}></div>

                <div style={{ textAlign: "center" }}>
                    <h2 style={styles.title}>
                        {text}
                    </h2>

                    <p style={styles.subtitle}>
                        Mohon tunggu sebentar
                    </p>
                </div>

            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "#FDF8F3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Poppins', sans-serif",
    },

    card: {
        background: "#fff",
        border: "1px solid #F3E8DA",
        borderRadius: 32,
        padding: "42px 46px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        boxShadow: "0 12px 35px rgba(0,0,0,0.05)",
        minWidth: 280,
    },

    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "#FFF7ED",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    spinner: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "5px solid #F3E8DA",
        borderTop: "5px solid #C2410C",
        animation: "spin 1s linear infinite",
    },

    title: {
        margin: 0,
        fontSize: 22,
        color: "#78350F",
        fontWeight: 700,
    },

    subtitle: {
        marginTop: 8,
        color: "#A87D5A",
        fontSize: 14,
    },
};