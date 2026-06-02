import { supabase } from "../lib/supabase";

/* ═══════════════════════════════════════════════════════
   FUNGSI LAMA — tetap dipakai untuk admin / general use
   (getOrders, createOrder, updateOrder, deleteOrder)
═══════════════════════════════════════════════════════ */

export const getOrders = async () => {
    return await supabase
        .from("orders")
        .select("*")
        .order("order_date", { ascending: false });
};

export const createOrder = async (payload) => {
    return await supabase
        .from("orders")
        .insert([payload]);
};

export const updateOrder = async (id, payload) => {
    return await supabase
        .from("orders")
        .update(payload)
        .eq("id", id);
};

export const deleteOrder = async (id) => {
    return await supabase
        .from("orders")
        .delete()
        .eq("id", id);
};

/* ═══════════════════════════════════════════════════════
   FUNGSI BARU — untuk halaman customer (OrderPage.jsx)
   (throw error agar bisa ditangkap di hook / try-catch)
═══════════════════════════════════════════════════════ */

/* ─── Orders by customer ─────────────────────────── */

/** Ambil semua order milik 1 customer */
export async function fetchMyOrders(customerName) {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer", customerName)
        .order("order_date", { ascending: false });
    if (error) throw error;
    return data;
}

/** Ambil 1 order by id */
export async function fetchOrderById(id) {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
    if (error) throw error;
    return data;
}

/** Buat order baru dari customer (dengan ID custom) */
export async function placeOrder(payload) {
    const { data, error } = await supabase
        .from("orders")
        .insert(payload)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/** Batalkan order — hanya update status jadi 'cancelled' */
export async function cancelOrder(id) {
    const { data, error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/* ─── Stats ──────────────────────────────────────── */

/** Hitung statistik order untuk 1 customer */
export async function fetchOrderStats(customerName) {
    const { data, error } = await supabase
        .from("orders")
        .select("status, total")
        .eq("customer", customerName);
    if (error) throw error;

    const total = data.length;
    const pending = data.filter(o => o.status === "pending").length;
    const completed = data.filter(o => o.status === "completed").length;
    const cancelled = data.filter(o => o.status === "cancelled").length;
    const spent = data
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);

    return { total, pending, completed, cancelled, spent };
}

/* ─── Catalog (products) ─────────────────────────── */

/** Ambil semua produk untuk katalog customer (termasuk stok habis) */
export async function fetchCatalog({ search = "", categoryId = null } = {}) {
    let query = supabase
        .from("products")
        .select("*, categories(id, name)")
        .order("name");

    if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/** Ambil semua kategori untuk filter katalog */
export async function fetchCatalogCategories() {
    const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
    if (error) throw error;
    return data;
}

/* ─── Helper ─────────────────────────────────────── */

/** Generate ID order unik format ORD-XXXXXXXX */
export function generateOrderId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `ORD-${ts}-${rnd}`;
}