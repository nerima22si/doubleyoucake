import { supabase } from "../lib/supabase";

const TABLE = "products";
const BUCKET = "product-images";

/* ── READ ── */
export async function fetchProducts({ search = "", categoryId = null } = {}) {
    let query = supabase
        .from(TABLE)
        .select("*, categories(id, name)")
        .order("created_at", { ascending: false });

    if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function fetchProductById(id) {
    const { data, error } = await supabase
        .from(TABLE)
        .select("*, categories(id, name)")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
}

/* ── CREATE ── */
export async function createProduct(payload, imageFile) {
    let image_url = null;

    if (imageFile) {
        image_url = await uploadImage(imageFile);
    }

    const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...payload, image_url })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/* ── UPDATE ── */
export async function updateProduct(id, payload, imageFile, oldImageUrl) {
    let image_url = oldImageUrl ?? null;

    if (imageFile) {
        image_url = await uploadImage(imageFile);
        if (oldImageUrl) await deleteImageByUrl(oldImageUrl).catch(() => { });
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update({ ...payload, image_url })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/* ── DELETE ── */
export async function deleteProduct(id, imageUrl) {
    if (imageUrl) await deleteImageByUrl(imageUrl).catch(() => { });

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
}

/* ── STORAGE ── */
export async function uploadImage(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

async function deleteImageByUrl(url) {
    const path = url.split(`/${BUCKET}/`)[1]?.split("?")[0];
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
}

/* ── STATS ── */
export async function fetchProductStats() {
    const [
        { count: total },
        { count: outOfStock },
        { count: lowStock },
        { data: priceData },
    ] = await Promise.all([
        supabase.from(TABLE).select("*", { count: "exact", head: true }),
        supabase.from(TABLE).select("*", { count: "exact", head: true }).eq("stock", 0),
        supabase.from(TABLE).select("*", { count: "exact", head: true }).gt("stock", 0).lte("stock", 10),
        supabase.from(TABLE).select("price"),
    ]);

    const totalValue = priceData?.reduce((sum, p) => sum + Number(p.price), 0) ?? 0;

    return { total: total ?? 0, outOfStock: outOfStock ?? 0, lowStock: lowStock ?? 0, totalValue };
}