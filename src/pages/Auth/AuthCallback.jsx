import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/login");
            return;
        }

        /* CEK PROFILE */

        const { data: profile } =
            await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

        /* REDIRECT */

        const role = String(profile?.role || "").trim().toLowerCase();

        if (role === "admin") {
            navigate("/dashboard/admin");
        } else if (role === "cashier") {
            navigate("/cashier/dashboard/cashier");
        } else {
            navigate("/customer/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            Loading...
        </div>
    );
}