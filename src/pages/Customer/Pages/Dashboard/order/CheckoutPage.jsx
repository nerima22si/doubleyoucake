import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../../lib/supabase";
import {
    ShoppingBag,
    MapPin,
    CreditCard,
    MessageSquare,
    ArrowLeft,
    CheckCircle,
} from "lucide-react";
import { MdKeyboardArrowLeft } from "react-icons/md";

const CheckoutPage = () => {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        fetchCart();

        const channel = supabase
            .channel("checkout-page-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "cart_items",
                },
                () => fetchCart()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "carts",
                },
                () => fetchCart()
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "products",
                },
                () => fetchCart()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const fetchCart = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                navigate("/login");
                return;
            }

            const { data: cartData, error: cartError } = await supabase
                .from("carts")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (cartError) throw cartError;

            if (!cartData) {
                setCartItems([]);
                return;
            }

            setCart(cartData);

            const { data, error } = await supabase
                .from("cart_items")
                .select(`
                        id,
                        cart_id,
                        product_id,
                        qty,
                        reference_image_url,
                        custom_note,
                        products (
                            id,
                            name,
                            price,
                            image_url
                        )
                        `)
                .eq("cart_id", cartData.id);

            if (error) throw error;

            setCartItems(data || []);
        } catch (error) {
            console.error("Fetch checkout error:", error.message);
            alert("Gagal mengambil data checkout");
        } finally {
            setLoading(false);
        }
    };

    const totalPrice = cartItems.reduce((total, item) => {
        return total + Number(item.products?.price || 0) * Number(item.qty || 0);
    }, 0);

    const generateOrderId = () => {
        const date = new Date();
        const time = date.getTime();
        return `ORD-${time}`;
    };

    const handleCheckout = async () => {
        try {
            if (!shippingAddress.trim()) {
                alert("Alamat pengiriman wajib diisi");
                return;
            }

            if (cartItems.length === 0) {
                alert("Keranjang masih kosong");
                return;
            }

            setCheckoutLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error("User belum login");

            const orderId = generateOrderId();

            const { error: orderError } = await supabase.from("orders").insert({
                id: orderId,
                user_id: user.id,
                total_price: totalPrice,
                status: "Masuk",
                payment_method: paymentMethod,
                payment_status: "pending",
                shipping_address: shippingAddress,
                notes: notes,
            });

            if (orderError) throw orderError;

            const orderItemsData = cartItems.map((item) => ({
                order_id: orderId,
                product_id: item.products.id,
                qty: item.qty,
                price: item.products.price,
                reference_image_url: item.reference_image_url || null,
                custom_note: item.custom_note || null,
            }));

            const { error: orderItemsError } = await supabase
                .from("order_items")
                .insert(orderItemsData);

            if (orderItemsError) throw orderItemsError;

            const { error: deleteCartItemsError } = await supabase
                .from("cart_items")
                .delete()
                .eq("cart_id", cart.id);

            if (deleteCartItemsError) throw deleteCartItemsError;

            alert("Checkout berhasil! Pesanan berhasil dibuat.");
            navigate("/customer/my-orders/" + orderId);
        } catch (error) {
            console.error("Checkout error:", error.message);
            alert("Checkout gagal: " + error.message);
        } finally {
            setCheckoutLoading(false);
        }
    };

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
                        <div
                            className="
                            w-16
                            h-16
                            rounded-full
                            border-[5px]
                            border-[#EBD9C1]
                            border-t-[#4A2C2A]
                            animate-spin
                        "
                        />

                        <div className="text-center">
                            <h2 className="text-xl font-black text-[#4A2C2A]">
                                Memuat Checkout...
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
        <div className="min-h-screen rounded-2xl shadow bg-[#FFFBF5] text-[#4A2C2A] px-6 py-10">
            <div className="max-w mx-auto">
                <div className="mb-8" >
                    <button
                        onClick={() => navigate("/customer/cart")}
                        className="
                            mb-8
                            flex
                            items-center
                            gap-2
                            px-5
                            py-3
                            rounded-2xl
                            bg-[#4A2C2A]
                            border
                          
                            text-sm
                            font-bold
                            text-white
                            shadow-lg
                            hover:scale-[1.02]
                            hover:shadow-2xl
                            hover:bg-gradient-to-r
                            hover:from-[#4A2C2A]
                            hover:via-[#8B5E3C]
                            hover:to-[#C08B5C]
                            transition-all
                            duration-300
                        "
                    >
                        <MdKeyboardArrowLeft size={18} />
                        
                    </button>
                </div>


                <div className="mb-10">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                        Checkout
                    </h1>
                    <p className="text-[#6B4E4C] mt-3 font-medium">
                        Lengkapi data pesananmu sebelum melanjutkan pembayaran.
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-[#EBD9C1] text-center">
                        <ShoppingBag size={54} className="mx-auto text-[#8B5E3C] mb-4" />
                        <h2 className="text-2xl font-black">Keranjang masih kosong</h2>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-6 px-8 py-3 bg-[#4A2C2A] text-white rounded-full font-bold hover:bg-[#8B5E3C]"
                        >
                            Belanja Sekarang
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#EBD9C1]/70">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Alamat Pengiriman</h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Masukkan alamat lengkap penerima pesanan.
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Contoh: Jl. Melati No. 10, Pekanbaru, Riau. Patokan rumah pagar putih."
                                    rows="5"
                                    className="w-full rounded-3xl border-2 border-[#EBD9C1] bg-[#FFFBF5] p-5 outline-none focus:border-[#8B5E3C] font-medium text-[#4A2C2A]"
                                />
                            </div>

                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#EBD9C1]/70">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Metode Pembayaran</h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Pilih metode pembayaran yang tersedia.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-4">
                                    {["Transfer Bank", "QRIS", "COD"].map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`p-5 rounded-3xl border-2 font-black transition-all ${paymentMethod === method
                                                ? "bg-[#4A2C2A] border-[#4A2C2A] text-white shadow-lg"
                                                : "bg-[#FFFBF5] border-[#EBD9C1] text-[#4A2C2A] hover:border-[#8B5E3C]"
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#EBD9C1]/70">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">Catatan Pesanan</h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Opsional, bisa dikosongkan.
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Tolong tulis ucapan Happy Birthday, warna dekorasi pink."
                                    rows="4"
                                    className="w-full rounded-3xl border-2 border-[#EBD9C1] bg-[#FFFBF5] p-5 outline-none focus:border-[#8B5E3C] font-medium text-[#4A2C2A]"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="sticky top-8 bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#EBD9C1]/70">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <h2 className="text-xl font-black">Ringkasan Pesanan</h2>
                                </div>

                                <div className="space-y-5 max-h-[360px] overflow-y-auto pr-2">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <img
                                                src={item.products?.image_url}
                                                alt={item.products?.name}
                                                className="w-20 h-20 rounded-3xl object-cover bg-[#FDF5E6]"
                                            />

                                            <div className="flex-1">
                                                <h3 className="font-black leading-tight">
                                                    {item.products?.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 font-bold mt-1">
                                                    Qty: {item.qty}
                                                </p>
                                                <p className="text-[#8B5E3C] font-black mt-1">
                                                    {formatRupiah(
                                                        Number(item.products?.price || 0) *
                                                        Number(item.qty || 0)
                                                    )}
                                                </p>
                                                {item.reference_image_url && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-black text-[#8B5E3C] mb-2">
                                                            Foto Referensi
                                                        </p>

                                                        <img
                                                            src={item.reference_image_url}
                                                            alt="Foto referensi custom cake"
                                                            className="w-24 h-24 rounded-2xl object-cover border border-[#EBD9C1]"
                                                        />
                                                    </div>
                                                )}

                                                {item.custom_note && (
                                                    <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                                                        Catatan: {item.custom_note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[#EBD9C1] mt-8 pt-6 space-y-4">
                                    <div className="flex justify-between text-sm font-bold text-slate-500">
                                        <span>Subtotal</span>
                                        <span>{formatRupiah(totalPrice)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm font-bold text-slate-500">
                                        <span>Status Pembayaran</span>
                                        <span>Pending</span>
                                    </div>

                                    <div className="flex justify-between items-center pt-3">
                                        <span className="text-lg font-black">Total</span>
                                        <span className="text-2xl font-black text-[#8B5E3C]">
                                            {formatRupiah(totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={checkoutLoading}
                                    className="mt-8 w-full py-5 rounded-3xl bg-[#4A2C2A] text-white font-black text-lg hover:bg-[#8B5E3C] transition-all shadow-xl disabled:opacity-60 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle size={22} />
                                    {checkoutLoading ? "Memproses..." : "Buat Pesanan"}
                                </button>

                                <p className="mt-5 text-xs text-slate-400 font-bold text-center leading-relaxed">
                                    Setelah pesanan dibuat, admin akan memproses dan mengonfirmasi pembayaran.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckoutPage;