import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";


export function useCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();

        const channel = supabase
            .channel("category-management-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "categories",
                },
                () => fetchCategories(false)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchCategories = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setCategories(data || []);
        } catch (error) {
            console.error("Fetch categories error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const addCategory = async (payload) => {
        const { error } = await supabase
            .from("categories")
            .insert(payload);

        if (error) throw error;

        await fetchCategories(false);
    };

    const updateCategory = async (id, payload) => {
        const { error } = await supabase
            .from("categories")
            .update(payload)
            .eq("id", id);

        if (error) throw error;

        await fetchCategories(false);
    };

    const deleteCategory = async (id) => {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await fetchCategories(false);
    };

    return {
        categories,
        loading,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
    };
}