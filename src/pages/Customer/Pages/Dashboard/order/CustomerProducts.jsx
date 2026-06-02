import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Search, X, UploadCloud } from "lucide-react";

const BUCKET_NAME = "custom-cake-references";

const CustomerProducts = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
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
            .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
            .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, () => fetchCartCount())
            .on("postgres_changes", { event: "*", schema: "public", table: "carts" }, () => fetchCartCount())
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
                .order("id", { ascending: false });

            if (error) throw error;

            setProducts(data || []);
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
                const { error: insertError } = await supabase.from("cart_items").insert({
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

            const { error: insertError } = await supabase.from("cart_items").insert({
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

    const filteredProducts = products.filter((product) =>
        product.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>

                <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                    <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                        <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />

                        <div className="text-center">
                            <h2 className="text-xl font-black text-[#4A2C2A]">
                                Memuat Produk...
                            </h2>

                            <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                                Mohon tunggu sebentar
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen rounded-2xl shadow bg-[#FFFBF5] text-[#4A2C2A] px-4 md:px-6 py-8 md:py-10">
                <div className="max-w mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
                        <div>
                            <p className="text-xs md:text-sm font-black text-[#8B5E3C] uppercase tracking-widest">
                                Doubleyou.Cake
                            </p>

                            <h1 className="text-3xl md:text-5xl font-black mt-2">
                                Katalog Produk
                            </h1>

                            <p className="text-[#6B4E4C] mt-2 md:mt-3 font-medium text-sm md:text-base">
                                Pilih kue favoritmu dan tambahkan ke keranjang.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/customer/cart")}
                            className="
                                relative px-5 md:px-6 py-3 md:py-4
                                bg-[#4A2C2A] text-white rounded-full font-black
                                hover:scale-[1.02] hover:shadow-2xl
                                hover:bg-gradient-to-r hover:from-[#4A2C2A]
                                hover:via-[#8B5E3C] hover:to-[#C08B5C]
                                transition-all duration-300 flex items-center gap-2 w-fit
                            "
                        >
                            <ShoppingBag size={20} />
                            Keranjang

                            {cartCount > 0 && (
                                <span
                                    className="
                                        absolute -top-2 -right-2 min-w-[24px] h-6 px-1
                                        bg-[#C08B5C] text-white text-xs font-bold rounded-full
                                        flex items-center justify-center border-2 border-white
                                        shadow-lg animate-bounce
                                    "
                                >
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="bg-white border border-[#EBD9C1] rounded-[1.5rem] md:rounded-[2rem] p-4 mb-8 shadow-sm flex items-center gap-3">
                        <Search className="text-[#8B5E3C]" size={22} />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent outline-none font-bold text-[#4A2C2A] placeholder:text-slate-400"
                        />
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-12 text-center border border-[#EBD9C1] shadow-sm">
                            <h2 className="text-2xl font-black">Produk belum tersedia</h2>
                            <p className="text-slate-500 font-medium mt-2">
                                Silakan tambah produk dari halaman admin terlebih dahulu.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#EBD9C1]/70 hover:-translate-y-1"
                                >
                                    <div className="aspect-square overflow-hidden bg-[#FDF5E6]">
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>

                                    <div className="p-3 md:p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            {isCustomCake(product) && (
                                                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-[#FDF5E6] text-[#8B5E3C] border border-[#EBD9C1]">
                                                    CUSTOM
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm md:text-lg font-black line-clamp-2 leading-tight group-hover:text-[#8B5E3C] transition-colors">
                                            {product.name}
                                        </h3>

                                        <p className="hidden md:block text-slate-500 text-sm font-medium mt-3 line-clamp-2">
                                            {product.description ||
                                                "Produk kue premium dari Doubleyou.Cake."}
                                        </p>

                                        <div className="flex items-center justify-between mt-4 md:mt-6 pt-3 md:pt-5 border-t border-[#F1E4D1]">
                                            <span className="text-sm md:text-lg font-black text-[#8B5E3C]">
                                                {formatRupiah(product.price)}
                                            </span>

                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center hover:bg-gradient-to-r hover:from-[#4A2C2A] hover:via-[#8B5E3C] hover:to-[#C08B5C] transition-all duration-300 shadow-lg"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCustomModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] border border-[#EBD9C1] shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBD9C1]">
                            <div>
                                <p className="text-xs font-black text-[#8B5E3C] uppercase tracking-widest">
                                    Custom Cake
                                </p>
                                <h2 className="text-2xl font-black text-[#4A2C2A]">
                                    Tambah Referensi
                                </h2>
                            </div>

                            <button
                                onClick={() => setShowCustomModal(false)}
                                className="w-10 h-10 rounded-full bg-[#FDF5E6] text-[#4A2C2A] flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex gap-4 items-center">
                                <img
                                    src={selectedProduct?.image_url}
                                    alt={selectedProduct?.name}
                                    className="w-20 h-20 rounded-2xl object-cover bg-[#FDF5E6]"
                                />

                                <div>
                                    <h3 className="font-black text-[#4A2C2A]">
                                        {selectedProduct?.name}
                                    </h3>
                                    <p className="font-black text-[#8B5E3C] mt-1">
                                        {formatRupiah(selectedProduct?.price)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#4A2C2A] mb-2">
                                    Upload Foto Referensi
                                </label>

                                <label className="min-h-[170px] border-2 border-dashed border-[#EBD9C1] bg-[#FFFBF5] rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-[190px] object-cover"
                                        />
                                    ) : (
                                        <div className="text-center p-5">
                                            <UploadCloud
                                                size={42}
                                                className="mx-auto text-[#8B5E3C]"
                                            />
                                            <p className="font-black text-[#4A2C2A] mt-3">
                                                Klik untuk upload foto
                                            </p>
                                            <p className="text-xs font-semibold text-slate-400 mt-1">
                                                JPG, PNG, WEBP
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setReferenceImage(file);
                                            setPreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#4A2C2A] mb-2">
                                    Catatan Desain
                                </label>

                                <textarea
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    placeholder="Contoh: warna pink, tulisan Happy Birthday, tema bunga..."
                                    rows={4}
                                    className="w-full rounded-[1.5rem] border-2 border-[#EBD9C1] bg-[#FFFBF5] p-4 outline-none focus:border-[#8B5E3C] font-semibold text-[#4A2C2A] resize-none"
                                />
                            </div>

                            <button
                                onClick={handleCustomCakeSubmit}
                                disabled={savingCustom}
                                className="w-full py-4 rounded-full bg-[#4A2C2A] text-white font-black hover:bg-gradient-to-r hover:from-[#4A2C2A] hover:via-[#8B5E3C] hover:to-[#C08B5C] transition-all duration-300 shadow-xl disabled:opacity-60"
                            >
                                {savingCustom ? "Menambahkan..." : "Tambah ke Keranjang"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomerProducts;