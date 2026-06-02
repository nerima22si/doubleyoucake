import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import MainContent from "./MainContent";
import { supabase } from "../../lib/supabase";

const CustomerPage = () => {
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Semua");

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["Semua"]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);

        window.addEventListener("scroll", handleScroll);
        fetchProducts();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);

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

            const mappedProducts = (data || []).map((item) => ({
                id: item.id,
                title: item.name,
                category: item.categories?.name || "Tanpa Kategori",
                price: Number(item.price || 0),
                priceLabel: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(Number(item.price || 0)),
                description: item.description || "-",
                image:
                    item.image_url ||
                    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800",
            }));

            const categoryList = [
                "Semua",
                ...new Set(mappedProducts.map((item) => item.category)),
            ];

            setProducts(mappedProducts);
            setCategories(categoryList);
        } catch (error) {
            console.error("Fetch customer products error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCatalog = useMemo(() => {
        if (activeCategory === "Semua") return products;

        return products.filter((cake) => cake.category === activeCategory);
    }, [products, activeCategory]);

    const checkLogin = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            navigate("/login");
            return null;
        }

        return user;
    };

    const handleAddToCart = async (product) => {
        const user = await checkLogin();
        if (!user) return;

        const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from("cart_items")
                .update({
                    quantity: Number(existing.quantity || 0) + 1,
                })
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

    const handleOrder = async (product) => {
        const user = await checkLogin();
        if (!user) return;

        navigate(`/order/${product.id}`);
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] text-[#4A2C2A] font-sans">
            <Header
                scrolled={scrolled}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                handleOrder={() => navigate("/catalog")}
            />

            {loading ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <p className="font-black text-gray-400">Loading katalog...</p>
                </div>
            ) : (
                <MainContent
                    categories={categories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    filteredCatalog={filteredCatalog}
                    handleOrder={handleOrder}
                    handleAddToCart={handleAddToCart}
                />
            )}

            <Footer />
        </div>
    );
};

export default CustomerPage;