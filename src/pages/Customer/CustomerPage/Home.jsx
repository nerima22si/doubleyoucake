import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingBag,
    Instagram,
    MessageSquare,
    ChevronRight,
    Clock,
    MapPin,
    Star,
    Award,
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

export default function HomePage() {
    const navigate = useNavigate();

    const [activeCategory, setActiveCategory] = useState("Semua");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["Semua"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel("home-products-realtime")
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

            const [productsRes, categoriesRes] = await Promise.all([
                supabase
                    .from("products")
                    .select(`
                        id,
                        name,
                        description,
                        price,
                        image_url,
                        product_status,
                        category_id,
                        created_at,
                        categories:category_id (
                            id,
                            name
                        )
                    `)
                    .eq("product_status", "published")
                    .order("created_at", { ascending: false }),

                supabase
                    .from("categories")
                    .select("id, name")
                    .order("name", { ascending: true }),
            ]);

            if (productsRes.error) throw productsRes.error;
            if (categoriesRes.error) throw categoriesRes.error;

            const mappedProducts = (productsRes.data || []).map((item) => ({
                id: item.id,
                title: item.name,
                category: item.categories?.name || "Tanpa Kategori",
                category_id: item.category_id,
                price: Number(item.price || 0),
                priceLabel: formatRupiah(item.price),
                description: item.description || "-",
                image: item.image_url || fallbackImage,
            }));

            setProducts(mappedProducts);
            setCategories(["Semua", ...(categoriesRes.data || []).map((cat) => cat.name)]);
        } catch (error) {
            console.error("Fetch home products error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        if (activeCategory === "Semua") return products.slice(0, 6);
        return products.filter((item) => item.category === activeCategory).slice(0, 6);
    }, [products, activeCategory]);

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

        const { data: existing, error: existingError } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle();

        if (existingError) {
            console.error("Check cart error:", existingError.message);
            return;
        }

        if (existing) {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: Number(existing.quantity || 0) + 1 })
                .eq("id", existing.id);

            if (error) {
                console.error("Update cart error:", error.message);
                return;
            }
        } else {
            const { error } = await supabase.from("cart_items").insert({
                user_id: user.id,
                product_id: product.id,
                quantity: 1,
            });

            if (error) {
                console.error("Insert cart error:", error.message);
                return;
            }
        }

        navigate("/cart");
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] text-[#4A2C2A] font-sans selection:bg-[#EBD9C1] selection:text-[#4A2C2A] overflow-x-hidden">
            <HeroSection onCustom={() => navigate("/login")} />

            <FeaturesSection />

            <section id="katalog" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FFFBF5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14 lg:mb-16 space-y-3 sm:space-y-4">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4A2C2A]">
                            Katalog Menu
                        </h2>

                        <p className="text-sm sm:text-base text-[#6B4E4C] font-medium">
                            Pilih favoritmu atau pesan desain custom impianmu.
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-4 sm:pt-6">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border-2 ${activeCategory === cat
                                            ? "bg-[#4A2C2A] border-[#4A2C2A] text-white"
                                            : "bg-white border-[#EBD9C1] text-[#4A2C2A] hover:border-[#4A2C2A]"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-16 sm:py-20 text-center font-black text-gray-400">
                            Loading produk...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-16 sm:py-20 text-center bg-white rounded-[2rem] sm:rounded-[3rem] border border-[#EBD9C1] font-bold text-gray-400">
                            Produk belum tersedia.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-8">
                            {filteredProducts.map((item) => (
                                <div
                                    key={item.id}
                                    className="group bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#EBD9C1]/50"
                                >
                                    <div className="h-56 sm:h-64 lg:h-80 overflow-hidden relative">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />

                                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full text-[10px] sm:text-xs font-black text-[#4A2C2A]">
                                            {item.category}
                                        </div>

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 sm:p-6">
                                            <button
                                                onClick={() => handleOrder(item)}
                                                className="bg-white text-[#4A2C2A] px-5 sm:px-8 py-3 rounded-full font-bold text-sm sm:text-base flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                                            >
                                                Pesan Sekarang <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6 lg:p-8">
                                        <h3 className="text-lg sm:text-xl font-black leading-tight group-hover:text-[#8B5E3C] transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-slate-500 text-xs sm:text-sm my-4 sm:my-6 leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                            <span className="text-base sm:text-lg lg:text-xl font-black text-[#8B5E3C]">
                                                {item.priceLabel}
                                            </span>

                                            <button
                                                onClick={() => handleCart(item)}
                                                className="bg-[#FDF5E6] text-[#8B5E3C] p-3 sm:p-4 rounded-2xl hover:bg-[#4A2C2A] hover:text-white transition-all"
                                                title="Tambah ke Keranjang"
                                            >
                                                <ShoppingBag size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-center mt-10 sm:mt-12">
                        <button
                            onClick={() => navigate("/katalog")}
                            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-[#4A2C2A] text-white rounded-full font-black hover:bg-[#8B5E3C]"
                        >
                            Lihat Semua Produk
                        </button>
                    </div>
                </div>
            </section>

            <CTASection onCustom={() => navigate("/login")} />
        </div>
    );
}

function HeroSection({ onCustom }) {
    return (
        <section id="home" className="relative pt-28 sm:pt-32 lg:pt-40 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-12">
                <div className="flex-1 space-y-5 sm:space-y-7 lg:space-y-8 text-center lg:text-left z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-[#4A2C2A] leading-[0.95]">
                        Sweetness <br />
                        <span className="text-[#8B5E3C]">Handcrafted</span> <br />
                        For You.
                    </h1>

                    <p className="text-sm sm:text-base lg:text-lg text-[#6B4E4C] max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                        Dari dapur kami ke hati Anda. Nikmati kelezatan kue premium untuk setiap momen spesial.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4">
                        <a
                            href="#katalog"
                            className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-[#8B5E3C] text-white rounded-full font-bold text-sm sm:text-base lg:text-lg hover:bg-[#4A2C2A] transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                        >
                            Lihat Menu <ShoppingBag size={20} />
                        </a>

                        <button
                            onClick={onCustom}
                            className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white border-2 border-[#8B5E3C] text-[#8B5E3C] rounded-full font-bold text-sm sm:text-base lg:text-lg hover:bg-orange-50 transition-all"
                        >
                            Custom Kue
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative w-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-[#EBD9C1] rounded-full opacity-30 blur-3xl" />

                    <img
                        src="/src/assets/cake.png"
                        alt="Cake Decoration"
                        className="relative z-10 w-full h-72 sm:h-96 lg:h-[600px] object-cover rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-2xl border-4 sm:border-8 border-white rotate-1 lg:rotate-2 hover:rotate-0 transition-transform duration-700"
                    />
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    return (
        <section className="bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 text-center">
                {[
                    {
                        icon: <Award size={32} />,
                        title: "Bahan Premium",
                        desc: "Menggunakan bahan berkualitas terbaik.",
                    },
                    {
                        icon: <Clock size={32} />,
                        title: "Freshly Baked",
                        desc: "Dibuat fresh untuk menjaga rasa.",
                    },
                    {
                        icon: <Star size={32} />,
                        title: "Desain Custom",
                        desc: "Ceritakan ide Anda, kami wujudkan.",
                    },
                ].map((f) => (
                    <div key={f.title} className="space-y-3 sm:space-y-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FDF5E6] text-[#8B5E3C] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                            {f.icon}
                        </div>

                        <h3 className="font-bold text-lg sm:text-xl">{f.title}</h3>

                        <p className="text-slate-500 text-sm">{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function CTASection({ onCustom }) {
    return (
        <section id="tentang" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto bg-[#4A2C2A] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-20 text-center text-[#FFFBF5] relative overflow-hidden shadow-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black italic">
                    Wujudkan Momen Manismu!
                </h2>

                <p className="text-sm sm:text-lg lg:text-xl text-[#EBD9C1] max-w-2xl mx-auto font-medium mt-4 sm:mt-6">
                    Butuh kue custom untuk ulang tahun, pernikahan, atau momen spesial?
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8">
                    <button
                        onClick={onCustom}
                        className="w-full md:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-[#EBD9C1] text-[#4A2C2A] rounded-2xl font-black text-base sm:text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3"
                    >
                        <MessageSquare size={24} />
                        Custom Order
                    </button>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <a href="#" className="p-3 sm:p-4 bg-white/10 rounded-2xl hover:bg-white/20">
                            <Instagram size={26} />
                        </a>

                        <a href="#" className="p-3 sm:p-4 bg-white/10 rounded-2xl hover:bg-white/20">
                            <MapPin size={26} />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}