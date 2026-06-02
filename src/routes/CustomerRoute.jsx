import { Navigate } from "react-router-dom";
// import { useAuth } from "../hooks/useAuth";
import { useAuth } from "../Contexts/AuthContext";

export default function CustomerRoute({ children }) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return <h1>Loading...</h1>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!profile) {
        return <h1>Memuat profile...</h1>;
    }

    if (profile.role !== "customer") {
        return <Navigate to="/401" replace />;
    }

    return children;
}