import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export const useMyOrders = (navigate) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                navigate("/login");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            *,
            products:product_id (
              id,
              name,
              image_url
            )
          )
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setOrders(data || []);
        } catch (error) {
            console.error("Fetch orders error:", error);
            alert("Gagal mengambil riwayat pesanan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel("customer-orders-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                fetchOrders
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "order_items" },
                fetchOrders
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { orders, loading };
};