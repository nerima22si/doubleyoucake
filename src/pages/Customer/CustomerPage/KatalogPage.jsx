import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingBag,
    Search,
    Star,
    Info,
    Heart,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value || 0));

const fallbackImage =
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800";

export default function KatalogPage() {
    const navigate = useNavigate();

    const [activeCategory, setActiveCategory] = useState("Semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState(["Semua"]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel("catalog-products-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                () => fetchProducts(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "categories" },
                () => fetchProducts(false)
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchProducts = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data, error } = await supabase
                .from("products")
                .select(`
                    id,
                    name,
                    description,
                    price,
                    image_url,
                    product_status,
                    category_id,
                    categories:category_id (
                        id,
                        name
                    )
                `)
                .eq("product_status", "published")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const mapped = (data || []).map((item) => ({
                id: item.id,
                title: item.name,
                category: item.categories?.name || "Tanpa Kategori",
                price: Number(item.price || 0),
                priceLabel: formatRupiah(item.price),
                description: item.description || "-",
                image: item.image_url || fallbackImage,
                rating: 4.9,
            }));

            setProducts(mapped);
            setCategories(["Semua", ...new Set(mapped.map((p) => p.category))]);
        } catch (error) {
            console.error("Fetch catalog products error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const filteredCatalog = useMemo(() => {
        return products.filter((cake) => {
            const matchCategory =
                activeCategory === "Semua" || cake.category === activeCategory;

            const matchSearch =
                cake.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cake.description.toLowerCase().includes(searchQuery.toLowerCase());

            return matchCategory && matchSearch;
        });
    }, [products, activeCategory, searchQuery]);

    const requireLogin = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/login");
            return null;
        }

        return user;
    };

    const handleOrder = async (product) => {
        const user = await requireLogin();
        if (!user) return;

        navigate(`/order/${product.id}`);
    };

    const handleCart = async (product) => {
        const user = await requireLogin();
        if (!user) return;

        const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("cart_items")
                .update({ quantity: Number(existing.quantity || 0) + 1 })
                .eq("id", existing.id);
        } else {
            await supabase.from("cart_items").insert({
                user_id: user.id,
                product_id: product.id,
                quantity: 1,
            });
        }

        navigate("/cart");
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] text-[#4A2C2A] font-sans pb-20 overflow-x-hidden">
            <div className="bg-white/80 backdrop-blur-md border-b border-[#EBD9C1]/40 pt-20 sm:pt-24 lg:pt-28 pb-5 sm:pb-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                            Katalog <span className="text-[#8B5E3C]">Kue</span>
                        </h1>

                        <div className="relative w-full md:w-96">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B5E3C]/40"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Cari rasa favoritmu..."
                                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-[#FDF5E6] rounded-2xl outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 border-none text-sm font-medium transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-2 sm:gap-3 mt-5 sm:mt-8 pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeCategory === cat
                                        ? "bg-[#4A2C2A] border-[#4A2C2A] text-white shadow-md scale-105"
                                        : "bg-white border-[#EBD9C1] text-[#4A2C2A] hover:border-[#8B5E3C]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
                {loading ? (
                    <div className="py-24 sm:py-32 text-center font-black text-gray-400">
                        Loading produk...
                    </div>
                ) : filteredCatalog.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-10">
                        {filteredCatalog.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex flex-col h-full bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#EBD9C1]/20"
                            >
                                <div className="h-56 sm:h-64 lg:h-80 overflow-hidden relative">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />

                                    <div className="absolute top-4 sm:top-5 left-4 sm:left-5 bg-[#4A2C2A]/90 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider z-10">
                                        {item.category}
                                    </div>

                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20">
                                        <button
                                            onClick={() => handleOrder(item)}
                                            className="bg-white text-[#4A2C2A] px-6 sm:px-8 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-[#8B5E3C] hover:text-white"
                                        >
                                            Pesan Sekarang
                                        </button>

                                        <button className="text-white flex items-center gap-1 text-xs font-bold opacity-80 hover:opacity-100">
                                            <Heart size={14} /> Tambah Favorit
                                        </button>
                                    </div>

                                    <div className="absolute bottom-4 sm:bottom-5 right-4 sm:right-5 bg-white/95 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg z-10">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-xs font-black">{item.rating}</span>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 lg:p-8 flex flex-col flex-grow">
                                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black mb-3 group-hover:text-[#8B5E3C] transition-colors leading-tight">
                                        {item.title}
                                    </h3>

                                    <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8 line-clamp-2 leading-relaxed font-medium italic">
                                        "{item.description}"
                                    </p>

                                    <div className="mt-auto pt-5 sm:pt-6 border-t border-[#FDF5E6] flex items-center justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                Estimasi Harga
                                            </span>
                                            <span className="text-base sm:text-lg lg:text-xl font-black text-[#8B5E3C]">
                                                {item.priceLabel}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleCart(item)}
                                            className="bg-[#FDF5E6] text-[#8B5E3C] p-3 sm:p-4 rounded-2xl hover:bg-[#4A2C2A] hover:text-white transition-all transform hover:rotate-12 shadow-sm flex items-center justify-center"
                                            title="Tambah ke Keranjang"
                                        >
                                            <ShoppingBag size={22} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 sm:py-32 text-center bg-white rounded-[2rem] sm:rounded-[4rem] border-2 border-dashed border-[#EBD9C1] px-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#FFFBF5] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={42} className="text-[#EBD9C1]" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#4A2C2A]">
                            Produk belum ada...
                        </h3>
                        <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">
                            Coba cari dengan kata kunci lain.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setActiveCategory("Semua");
                            }}
                            className="mt-8 px-8 sm:px-10 py-3 sm:py-4 bg-[#8B5E3C] text-white rounded-full font-black shadow-xl hover:bg-[#4A2C2A] transition-all"
                        >
                            Reset Pencarian
                        </button>
                    </div>
                )}

                <div className="mt-14 sm:mt-20 lg:mt-24 bg-[#FDF5E6] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-10 border border-[#EBD9C1] relative overflow-hidden group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-md shrink-0 z-10">
                        <Info size={36} className="text-[#8B5E3C]" />
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <h4 className="font-black text-xl sm:text-2xl text-[#4A2C2A]">
                            Punya Ide Desain Sendiri?
                        </h4>
                        <p className="text-slate-600 text-sm sm:text-base mt-2 font-medium">
                            Login terlebih dahulu untuk membuat pesanan custom.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                        className="w-full md:w-auto px-6 sm:px-10 py-4 sm:py-5 bg-[#4A2C2A] text-white rounded-[1.5rem] font-black hover:bg-[#8B5E3C] transition-all shadow-xl hover:scale-105 active:scale-95 z-10"
                    >
                        Custom Order Sekarang
                    </button>
                </div>
            </div>

            <div className="fixed bottom-5 sm:bottom-8 right-5 sm:right-8 z-50">
                <button
                    onClick={() => navigate("/login")}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-[#8B5E3C] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#4A2C2A] transition-all hover:scale-110 active:rotate-12"
                    title="Login untuk membuka keranjang"
                >
                    <ShoppingBag size={26} />
                </button>
            </div>
        </div>
    );
}