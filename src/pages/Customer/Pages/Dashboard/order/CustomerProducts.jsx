import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Search, X, UploadCloud } from "lucide-react";

const BUCKET_NAME = "custom-cake-references";

const CustomerProducts = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["Semua"]);
    const [activeCategory, setActiveCategory] = useState("Semua");

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [referenceImage, setReferenceImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [customNote, setCustomNote] = useState("");
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [savingCustom, setSavingCustom] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCartCount();

        const channel = supabase
            .channel("products-page-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                () => fetchProducts()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "categories" },
                () => fetchProducts()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cart_items" },
                () => fetchCartCount()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "carts" },
                () => fetchCartCount()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const isCustomCake = (product) => {
        return (
            product?.categories?.name === "Custom Cake" ||
            product?.category === "Custom Cake" ||
            product?.name?.toLowerCase().includes("custom")
        );
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .eq("product_status", "published")
                .order("id", { ascending: false });

            if (error) throw error;

            const safeProducts = data || [];
            setProducts(safeProducts);

            const categoryList = [
                "Semua",
                ...new Set(
                    safeProducts
                        .map((product) => product.categories?.name)
                        .filter(Boolean)
                ),
            ];

            setCategories(categoryList);
        } catch (error) {
            console.error("Fetch products error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCartCount = async () => {
        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                setCartCount(0);
                return;
            }

            const { data: cart, error: cartError } = await supabase
                .from("carts")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (cartError) throw cartError;

            if (!cart) {
                setCartCount(0);
                return;
            }

            const { data: items, error: itemsError } = await supabase
                .from("cart_items")
                .select("qty")
                .eq("cart_id", cart.id);

            if (itemsError) throw itemsError;

            const total =
                items?.reduce((sum, item) => sum + Number(item.qty || 0), 0) || 0;

            setCartCount(total);
        } catch (error) {
            console.error("Fetch cart count error:", error.message);
        }
    };

    const getOrCreateCart = async () => {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
            navigate("/login");
            throw new Error("User belum login");
        }

        let { data: cart, error: cartError } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (cartError) throw cartError;

        if (!cart) {
            const { data: newCart, error: newCartError } = await supabase
                .from("carts")
                .insert({ user_id: user.id })
                .select()
                .single();

            if (newCartError) throw newCartError;

            cart = newCart;
        }

        return cart;
    };

    const handleAddToCart = async (product) => {
        try {
            if (isCustomCake(product)) {
                setSelectedProduct(product);
                setReferenceImage(null);
                setPreview(null);
                setCustomNote("");
                setShowCustomModal(true);
                return;
            }

            const cart = await getOrCreateCart();

            const { data: existingItem, error: itemError } = await supabase
                .from("cart_items")
                .select("*")
                .eq("cart_id", cart.id)
                .eq("product_id", product.id)
                .is("reference_image_url", null)
                .maybeSingle();

            if (itemError) throw itemError;

            if (existingItem) {
                const { error: updateError } = await supabase
                    .from("cart_items")
                    .update({ qty: existingItem.qty + 1 })
                    .eq("id", existingItem.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("cart_items")
                    .insert({
                        cart_id: cart.id,
                        product_id: product.id,
                        qty: 1,
                        reference_image_url: null,
                        custom_note: null,
                    });

                if (insertError) throw insertError;
            }

            fetchCartCount();
        } catch (error) {
            console.error("Add to cart error:", error.message);
            alert("Gagal menambahkan produk ke keranjang");
        }
    };

    const handleCustomCakeSubmit = async () => {
        try {
            if (!selectedProduct) return;

            setSavingCustom(true);

            const cart = await getOrCreateCart();

            let referenceImageUrl = null;

            if (referenceImage) {
                const fileExt = referenceImage.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(fileName, referenceImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                referenceImageUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase
                .from("cart_items")
                .insert({
                    cart_id: cart.id,
                    product_id: selectedProduct.id,
                    qty: 1,
                    reference_image_url: referenceImageUrl,
                    custom_note: customNote || null,
                });

            if (insertError) throw insertError;

            setShowCustomModal(false);
            setSelectedProduct(null);
            setReferenceImage(null);
            setPreview(null);
            setCustomNote("");
            fetchCartCount();
        } catch (error) {
            console.error("Custom cake error:", error.message);
            alert("Gagal menambahkan custom cake");
        } finally {
            setSavingCustom(false);
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchSearch = product.name
            ?.toLowerCase()
            .includes(search.toLowerCase());

        const matchCategory =
            activeCategory === "Semua" ||
            product.categories?.name === activeCategory;

        return matchSearch && matchCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
                <div className="bg-white border border-[#EBD9C1] rounded-[1.5rem] px-8 py-10 flex flex-col items-center gap-4 shadow-xl">
                    <div className="w-12 h-12 rounded-full border-[4px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />
                    <div className="text-center">
                        <h2 className="text-lg font-black text-[#4A2C2A]">
                            Memuat Produk...
                        </h2>
                        <p className="text-xs font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen rounded-2xl shadow bg-[#FFFBF5] text-[#4A2C2A] px-3 sm:px-5 lg:px-6 py-5 sm:py-8 lg:py-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-8">
                        <div>
                            <p className="text-[10px] sm:text-xs font-black text-[#8B5E3C] uppercase tracking-widest">
                                Doubleyou.Cake
                            </p>

                            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black mt-1 sm:mt-2">
                                Katalog Produk
                            </h1>

                            <p className="text-[#6B4E4C] mt-1.5 sm:mt-3 font-medium text-xs sm:text-sm lg:text-base">
                                Pilih kue favoritmu dan tambahkan ke keranjang.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/customer/cart")}
                            className="relative px-4 sm:px-6 py-2.5 sm:py-4 bg-[#4A2C2A] text-white rounded-full font-black hover:scale-[1.02] transition-all flex items-center gap-2 w-fit text-xs sm:text-sm"
                        >
                            <ShoppingBag size={18} />
                            Keranjang

                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-[#C08B5C] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="bg-white border border-[#EBD9C1] rounded-[1rem] sm:rounded-[1.5rem] lg:rounded-[2rem] p-3 sm:p-4 mb-4 shadow-sm flex items-center gap-2 sm:gap-3">
                        <Search className="text-[#8B5E3C]" size={20} />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent outline-none font-bold text-[#4A2C2A] placeholder:text-slate-400 text-xs sm:text-sm lg:text-base"
                        />
                    </div>

                    <div className="w-full overflow-x-auto mb-5 sm:mb-7 pb-2 -mx-1 px-1">
                        <div className="flex gap-2 min-w-max">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`shrink-0 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-black border whitespace-nowrap transition-all ${activeCategory === cat
                                            ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                                            : "bg-white text-[#4A2C2A] border-[#EBD9C1]"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-10 shadow-sm border border-[#EBD9C1] text-center">
                            <ShoppingBag
                                size={44}
                                className="mx-auto text-[#8B5E3C] mb-4"
                            />
                            <h2 className="text-xl sm:text-2xl font-black">
                                Produk tidak ditemukan
                            </h2>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group bg-white rounded-[1rem] sm:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#EBD9C1]/70"
                                >
                                    <div className="aspect-square overflow-hidden bg-[#FDF5E6]">
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="p-2.5 sm:p-3 lg:p-4">
                                        <div className="flex items-center gap-1 mb-1.5">
                                            {isCustomCake(product) && (
                                                <span className="px-2 py-0.5 rounded-full bg-[#FDF5E6] text-[#8B5E3C] text-[9px] sm:text-[10px] font-black">
                                                    Custom
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-black text-[#4A2C2A] text-xs sm:text-sm lg:text-base leading-tight line-clamp-2 min-h-[32px] sm:min-h-[38px]">
                                            {product.name}
                                        </h3>

                                        <p className="text-[#8B5E3C] font-black text-xs sm:text-sm lg:text-base mt-1.5 truncate">
                                            {formatRupiah(product.price)}
                                        </p>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="mt-2 sm:mt-3 w-full py-2 sm:py-2.5 rounded-full bg-[#4A2C2A] text-white text-[10px] sm:text-xs lg:text-sm font-black flex items-center justify-center gap-1.5 hover:bg-[#8B5E3C]"
                                        >
                                            <Plus size={13} />
                                            Tambah
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCustomModal && (
                <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 relative">
                        <button
                            onClick={() => setShowCustomModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-[#4A2C2A]"
                        >
                            <X size={22} />
                        </button>

                        <h2 className="text-xl sm:text-2xl font-black text-[#4A2C2A]">
                            Request Custom Cake
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Upload referensi dan tulis catatan custom cake.
                        </p>

                        <div className="mt-5">
                            <label className="block border-2 border-dashed border-[#EBD9C1] rounded-2xl p-5 text-center cursor-pointer bg-[#FFFBF5]">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-44 object-cover rounded-xl"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-[#8B5E3C]">
                                        <UploadCloud size={36} />
                                        <span className="text-sm font-bold">
                                            Upload Gambar Referensi
                                        </span>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setReferenceImage(file);
                                        setPreview(URL.createObjectURL(file));
                                    }}
                                />
                            </label>
                        </div>

                        <textarea
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder="Contoh: tema pink, tulisan Happy Birthday, ukuran sedang..."
                            rows={4}
                            className="mt-4 w-full rounded-2xl border border-[#EBD9C1] bg-[#FFFBF5] p-4 outline-none text-sm font-medium"
                        />

                        <button
                            onClick={handleCustomCakeSubmit}
                            disabled={savingCustom}
                            className="mt-5 w-full py-3 rounded-2xl bg-[#4A2C2A] text-white font-black text-sm disabled:opacity-60"
                        >
                            {savingCustom ? "Menyimpan..." : "Tambahkan ke Keranjang"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomerProducts;