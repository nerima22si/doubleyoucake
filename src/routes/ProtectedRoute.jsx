// import { Navigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";

// export default function ProtectedRoute({
//     children,
//     allowedRole,
// }) {
//     const [loading, setLoading] = useState(true);
//     const [session, setSession] = useState(null);
//     const [role, setRole] = useState(null);

//     useEffect(() => {
//         checkUser();
//     }, []);

//     async function checkUser() {
//         const {
//             data: { session },
//         } = await supabase.auth.getSession();

//         if (!session) {
//             setLoading(false);
//             return;
//         }

//         setSession(session);

//         const userId = session.user.id;

//         const { data, error } = await supabase
//             .from("profiles")
//             .select("role")
//             .eq("id", userId)
//             .single();

//         if (!error && data) {
//             setRole(data.role);
//         }

//         setLoading(false);
//     }

//     // Loading
//     if (loading) {
//         return (
//             <div
//                 style={{
//                     minHeight: "100vh",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontFamily: "Poppins",
//                     background: "#FFF7ED",
//                 }}
//             >
//                 Loading...
//             </div>
//         );
//     }

//     // Belum login
//     if (!session) {
//         return <Navigate to="/login" replace />;
//     }

//     // Role tidak sesuai
//     if (allowedRole && role !== allowedRole) {
//         return <Navigate to="/" replace />;
//     }

//     return children;
// }