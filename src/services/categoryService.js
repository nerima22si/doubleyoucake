import { supabase } from "../lib/supabase";
const TABLE = "categories";

export async function fetchCategories() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("id, name, created_at")
        .order("name", { ascending: true });
    if (error) throw error;
    return data;
}

export async function fetchCategoriesWithCount() {
    const { data, error } = await supabase
        .from(TABLE)
        .select("id, name, created_at, products(count)")
        .order("name", { ascending: true });
    if (error) throw error;
    return data.map((c) => ({ ...c, product_count: c.products?.[0]?.count ?? 0 }));
}

export async function createCategory(name) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({ name: name.trim() })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateCategory(id, name) {
    const { data, error } = await supabase
        .from(TABLE)
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteCategory(id) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
}