import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

import ProductSearch from "./components/POS/ProductSearch";
import CategoryTabs from "./components/POS/CategoryTabs";
import ProductCard from "./components/POS/ProductCard";
import CartPanel from "./components/POS/CartPanel";
import PaymentModal from "./components/POS/PaymentModal";
import AppDialog from "../../components/AppDialog";

const generateOrderId = () => `ORD-${Date.now()}`;

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

export default function POSSystem() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([{ id: "all", name: "All" }]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [paymentModal, setPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const [dialog, setDialog] = useState({
        open: false,
        type: "info",
        title: "",
        message: "",
    });

    const showDialog = ({ type = "info", title, message }) => {
        setDialog({ open: true, type, title, message });
    };

    const closeDialog = () => {
        setDialog((prev) => ({ ...prev, open: false }));
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel("pos-system-data")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                fetchData
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "categories" },
                fetchData
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchData = async () => {
        const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .select("id, name")
            .order("name", { ascending: true });

        if (categoryError) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Kategori",
                message: categoryError.message,
            });
            return;
        }

        const { data: productData, error: productError } = await supabase
            .from("products")
            .select(`
                id,
                name,
                price,
                image_url,
                product_status,
                category_id,
                created_at
            `)
            .eq("product_status", "published")
            .order("created_at", { ascending: false });

        if (productError) {
            showDialog({
                type: "error",
                title: "Gagal Mengambil Produk",
                message: productError.message,
            });
            return;
        }

        const safeCategories = categoryData || [];
        const safeProducts = productData || [];

        const mappedProducts = safeProducts.map((product) => {
            const category = safeCategories.find(
                (cat) => String(cat.id) === String(product.category_id)
            );

            return {
                ...product,
                category_name: category?.name || "Tanpa Kategori",
            };
        });

        setCategories([{ id: "all", name: "All" }, ...safeCategories]);
        setProducts(mappedProducts);
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchSearch = product.name
                ?.toLowerCase()
                .includes(search.toLowerCase());

            const matchCategory =
                selectedCategoryId === "all" ||
                String(product.category_id) === String(selectedCategoryId);

            return matchSearch && matchCategory;
        });
    }, [products, search, selectedCategoryId]);

    const addToCart = (product) => {
        const existing = cart.find((item) => item.id === product.id);

        if (existing) {
            setCart((prev) =>
                prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setCart((prev) => [...prev, { ...product, quantity: 1 }]);
        }
    };

    const updateQty = (id, type) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.id !== id) return item;

                    const newQty =
                        type === "plus" ? item.quantity + 1 : item.quantity - 1;

                    return { ...item, quantity: newQty };
                })
                .filter((item) => item.quantity > 0)
        );
    };

    const removeItem = (id) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const subtotal = useMemo(() => {
        return cart.reduce(
            (sum, item) => sum + Number(item.price || 0) * item.quantity,
            0
        );
    }, [cart]);

    const tax = 0;
    const total = subtotal + tax;

    const insertOrderItems = async (orderId) => {
        const itemsPayload = cart.map((item) => ({
            order_id: orderId,
            product_id: item.id,
            product_name: item.name,
            price: Number(item.price || 0),
            quantity: item.quantity,
        }));

        const { error } = await supabase.from("order_items").insert(itemsPayload);

        if (error) throw error;
    };

    const printThermalReceipt = (data) => {
        setReceiptData(data);

        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleOpenBill = async () => {
        try {
            if (cart.length === 0) {
                showDialog({
                    type: "warning",
                    title: "Cart Kosong",
                    message: "Silakan pilih produk terlebih dahulu sebelum membuat Open Bill.",
                });
                return;
            }

            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const orderId = generateOrderId();

            const { error: orderError } = await supabase.from("orders").insert({
                id: orderId,
                user_id: null,
                cashier_id: user?.id || null,
                customer_name: "Walk In Customer",
                order_source: "offline",
                total_price: total,
                payment_method: null,
                payment_status: "pending",
                status: "Open Bill",
                paid_at: null,
            });

            if (orderError) throw orderError;

            await insertOrderItems(orderId);

            setCart([]);
            await fetchData();

            showDialog({
                type: "success",
                title: "Open Bill Berhasil",
                message: "Bill berhasil disimpan. Silakan buka menu Order Payment untuk melanjutkan pembayaran.",
            });
        } catch (error) {
            showDialog({
                type: "error",
                title: "Gagal Membuat Open Bill",
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async ({ paymentMethod, cashReceived, change }) => {
        try {
            if (cart.length === 0) {
                showDialog({
                    type: "warning",
                    title: "Cart Kosong",
                    message: "Silakan pilih produk terlebih dahulu sebelum checkout.",
                });
                return;
            }

            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            const orderId = generateOrderId();
            const currentCart = [...cart];

            const { error: orderError } = await supabase.from("orders").insert({
                id: orderId,
                user_id: null,
                cashier_id: user?.id || null,
                customer_name: "Walk In Customer",
                order_source: "offline",
                total_price: total,
                payment_method: paymentMethod,
                payment_status: "paid",
                status: "Selesai",
                paid_at: new Date().toISOString(),
            });

            if (orderError) throw orderError;

            await insertOrderItems(orderId);

            printThermalReceipt({
                orderId,
                cart: currentCart,
                subtotal,
                tax,
                total,
                paymentMethod,
                cashReceived,
                change,
                date: new Date(),
            });

            setCart([]);
            setPaymentModal(false);
            await fetchData();

            showDialog({
                type: "success",
                title: "Transaksi Berhasil",
                message: "Transaksi POS berhasil disimpan dan struk thermal siap dicetak.",
            });
        } catch (error) {
            showDialog({
                type: "error",
                title: "Checkout Gagal",
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }

                        #thermal-receipt,
                        #thermal-receipt * {
                            visibility: visible !important;
                        }

                        #thermal-receipt {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm;
                            padding: 8px;
                            background: white;
                            color: black;
                            font-family: Arial, sans-serif;
                        }

                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                    }
                `}
            </style>

            <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 lg:gap-5 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <div className="mb-4 sm:mb-5 shrink-0">
                        <p className="text-[10px] sm:text-xs font-black text-[#8A5F41] uppercase tracking-widest">
                            Point Of Sale
                        </p>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#4A2C2A] mt-1">
                            POS System
                        </h1>

                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">
                            Pilih produk, proses pembayaran, cetak struk, atau simpan sebagai Open Bill.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <ProductSearch search={search} setSearch={setSearch} />
                    </div>

                    <div className="overflow-x-auto shrink-0">
                        <CategoryTabs
                            categories={categories}
                            selectedCategoryId={selectedCategoryId}
                            setSelectedCategoryId={setSelectedCategoryId}
                        />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-0 md:pr-2 pb-6">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full bg-white border border-[#E7DED7] rounded-3xl p-8 sm:p-10 text-center text-gray-400 font-bold">
                                Produk tidak ditemukan.
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={addToCart}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="w-full md:w-[350px] lg:w-[380px] 2xl:w-[420px] shrink-0 h-full">
                    <CartPanel
                        cart={cart}
                        subtotal={subtotal}
                        tax={tax}
                        total={total}
                        updateQty={updateQty}
                        removeItem={removeItem}
                        clearCart={clearCart}
                        onOpenBill={handleOpenBill}
                        onPay={() => setPaymentModal(true)}
                    />
                </div>

                <PaymentModal
                    open={paymentModal}
                    loading={loading}
                    total={total}
                    onClose={() => setPaymentModal(false)}
                    onSubmit={handleCheckout}
                />
            </div>

            {receiptData && <ThermalReceipt data={receiptData} />}

            <AppDialog
                open={dialog.open}
                type={dialog.type}
                title={dialog.title}
                message={dialog.message}
                confirmText="Mengerti"
                onConfirm={closeDialog}
                onCancel={closeDialog}
            />
        </>
    );
}

function ThermalReceipt({ data }) {
    return (
        <div id="thermal-receipt" className="hidden print:block">
            <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "16px" }}>
                    Double You Cake
                </h2>
                <p style={{ margin: 0, fontSize: "11px" }}>
                    Thermal Receipt
                </p>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            <RowPrint label="Order" value={`#${data.orderId}`} />
            <RowPrint
                label="Date"
                value={new Date(data.date).toLocaleString("id-ID")}
            />
            <RowPrint label="Payment" value={data.paymentMethod?.toUpperCase()} />

            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            {(data.cart || []).map((item) => (
                <div key={item.id} style={{ fontSize: "12px", marginBottom: "6px" }}>
                    <div style={{ fontWeight: "bold" }}>{item.name}</div>
                    <RowPrint
                        label={`${item.quantity} x ${formatRupiah(item.price)}`}
                        value={formatRupiah(Number(item.price || 0) * item.quantity)}
                    />
                </div>
            ))}

            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            <RowPrint label="Subtotal" value={formatRupiah(data.subtotal)} />
            <RowPrint label="Tax" value={formatRupiah(data.tax)} />
            <RowPrint label="Total" value={formatRupiah(data.total)} bold />

            {data.paymentMethod === "cash" && (
                <>
                    <RowPrint
                        label="Cash"
                        value={formatRupiah(data.cashReceived)}
                    />
                    <RowPrint
                        label="Change"
                        value={formatRupiah(data.change)}
                    />
                </>
            )}

            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

            <p style={{ textAlign: "center", fontSize: "11px", marginTop: "10px" }}>
                Terima kasih
            </p>
        </div>
    );
}

function RowPrint({ label, value, bold = false }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                fontSize: "12px",
                fontWeight: bold ? "bold" : "normal",
                marginBottom: "4px",
            }}
        >
            <span>{label}</span>
            <span style={{ textAlign: "right" }}>{value}</span>
        </div>
    );
}