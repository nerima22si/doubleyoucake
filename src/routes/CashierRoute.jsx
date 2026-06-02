import { Navigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

export default function CashierRoute({ children }) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-bold text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role = String(profile?.role || "").trim().toLowerCase();

    if (role !== "cashier" && role !== "admin") {
        return <Navigate to="/401" replace />;
    }

    return children;
}