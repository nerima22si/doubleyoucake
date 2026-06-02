import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET_NAME = "product-images";

export function useProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel("product-management-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                () => fetchProducts(false)
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "categories",
                },
                () => fetchProducts(false)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchProducts = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    categories:category_id (
                        id,
                        name
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setProducts(data || []);
        } catch (error) {
            console.error("Fetch products error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const uploadImage = async (imageFile) => {
        if (!imageFile) return null;

        const ext = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, imageFile);

        if (error) throw error;

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const addProduct = async (payload, imageFile) => {
        let imageUrl = null;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const { data, error } = await supabase
            .from("products")
            .insert({
                ...payload,
                image_url: imageUrl,
                product_status: payload.product_status || "published",
            })
            .select("id")
            .single();

        if (error) throw error;

        await supabase.from("inventory").insert({
            product_id: data.id,
            current_stock: 0,
            min_stock: 5,
            max_stock: 100,
            reorder_point: 5,
        });

        await fetchProducts(false);
    };

    const updateProduct = async (id, payload, imageFile, oldImageUrl) => {
        let imageUrl = oldImageUrl || null;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const { error } = await supabase
            .from("products")
            .update({
                ...payload,
                image_url: imageUrl,
            })
            .eq("id", id);

        if (error) throw error;

        await fetchProducts(false);
    };

    const deleteProduct = async (product) => {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", product.id);

        if (error) throw error;

        await fetchProducts(false);
    };

    return {
        products,
        loading,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
    };
}