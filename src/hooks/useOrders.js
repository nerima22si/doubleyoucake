import { useCallback, useEffect, useState } from "react";
import {
    fetchMyOrders,
    fetchOrderStats,
    createOrder,
    cancelOrder,
    fetchAllCatalog,
    fetchCatalogCategories,
    generateOrderId,
} from "../services/orderService";

/* ─── useOrders ──────────────────────────────────── */
export function useOrders(customerName) {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, cancelled: 0, spent: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        if (!customerName) return;
        setLoading(true);
        setError(null);
        try {
            const [data, s] = await Promise.all([
                fetchMyOrders(customerName),
                fetchOrderStats(customerName),
            ]);
            setOrders(data);
            setStats(s);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [customerName]);

    useEffect(() => { load(); }, [load]);

    const placeOrder = useCallback(async ({ customer, phone, product, total, notes }) => {
        const payload = {
            id: generateOrderId(),
            customer,
            phone,
            product,
            total,
            notes: notes || null,
            status: "pending",
            order_date: new Date().toISOString().split("T")[0],
        };
        const data = await createOrder(payload);
        await load();
        return data;
    }, [load]);

    const cancel = useCallback(async (id) => {
        await cancelOrder(id);
        await load();
    }, [load]);

    return { orders, stats, loading, error, reload: load, placeOrder, cancel };
}

/* ─── useCatalog ─────────────────────────────────── */
export function useCatalog(filters = {}) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [prods, cats] = await Promise.all([
                fetchAllCatalog(filters),
                fetchCatalogCategories(),
            ]);
            setProducts(prods);
            setCategories(cats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters.search, filters.categoryId]);

    useEffect(() => { load(); }, [load]);

    return { products, categories, loading };
}