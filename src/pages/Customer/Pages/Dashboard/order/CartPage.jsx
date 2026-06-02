import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../../lib/supabase";
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Edit3,
    X,
    UploadCloud,
} from "lucide-react";
import { MdKeyboardArrowLeft } from "react-icons/md";

const BUCKET_NAME = "custom-cake-references";

const CartPage = () => {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editModal, setEditModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editNote, setEditNote] = useState("");
    const [editImage, setEditImage] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        fetchCart(true);

        const channel = supabase
            .channel("cart-page-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cart_items" },
                () => fetchCart(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "products" },
                () => fetchCart(false)
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
        }).format(value || 0);
    };

    const isCustomItem = (item) => {
        return (
            item.reference_image_url ||
            item.custom_note ||
            item.products?.name?.toLowerCase().includes("custom")
        );
    };

    const fetchCart = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                setCartItems([]);
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
                    products:product_id (
                        id,
                        name,
                        price,
                        image_url
                    )
                `)
                .eq("cart_id", cartData.id)
                .order("id", { ascending: true });

            if (error) throw error;

            setCartItems(data || []);
        } catch (error) {
            console.error("Fetch cart error:", error.message);
            setCartItems([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const updateQty = async (itemId, currentQty, type) => {
        const newQty = type === "plus" ? currentQty + 1 : currentQty - 1;
        if (newQty < 1) return;

        setCartItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, qty: newQty } : item
            )
        );

        try {
            const { error } = await supabase
                .from("cart_items")
                .update({ qty: newQty })
                .eq("id", itemId);

            if (error) throw error;
        } catch (error) {
            setCartItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, qty: currentQty } : item
                )
            );
            alert("Gagal mengubah jumlah produk");
        }
    };

    const deleteItem = async (itemId) => {
        const oldItems = cartItems;

        // langsung hilang dari UI
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));

        try {
            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", itemId);

            if (error) throw error;
        } catch (error) {
            console.error("Delete item error:", error.message);

            // kalau gagal, balikin data
            setCartItems(oldItems);
        }
    };

    const openEditRequest = (item) => {
        setEditItem(item);
        setEditNote(item.custom_note || "");
        setEditPreview(item.reference_image_url || null);
        setEditImage(null);
        setEditModal(true);
    };

    const handleSaveRequest = async () => {
        try {
            if (!editItem) return;

            setSavingEdit(true);

            let imageUrl = editPreview;

            if (editImage) {
                const ext = editImage.name.split(".").pop();
                const fileName = `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(fileName, editImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                imageUrl = data.publicUrl;
            }

            const { error } = await supabase
                .from("cart_items")
                .update({
                    reference_image_url: imageUrl || null,
                    custom_note: editNote || null,
                })
                .eq("id", editItem.id);

            if (error) throw error;

            setCartItems((prev) =>
                prev.map((item) =>
                    item.id === editItem.id
                        ? {
                            ...item,
                            reference_image_url: imageUrl || null,
                            custom_note: editNote || null,
                        }
                        : item
                )
            );

            setEditModal(false);
            setEditItem(null);
            setEditImage(null);
            setEditPreview(null);
            setEditNote("");
        } catch (error) {
            alert("Gagal menyimpan request custom cake");
        } finally {
            setSavingEdit(false);
        }
    };

    const totalPrice = cartItems.reduce((total, item) => {
        return total + Number(item.products?.price || 0) * Number(item.qty || 0);
    }, 0);

    const totalQty = cartItems.reduce((total, item) => {
        return total + Number(item.qty || 0);
    }, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                    <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />
                    <div className="text-center">
                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Memuat Keranjang...
                        </h2>
                        <p className="text-sm font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen rounded-2xl shadow bg-[#FFFBF5] text-[#4A2C2A] px-6 py-10">
                <div className="max-w mx-auto">
                    <button
                        onClick={() => navigate("/customer/products")}
                        className="
                            mb-8 flex items-center gap-2 px-5 py-3 rounded-2xl
                            bg-[#4A2C2A] border border-[#4A2C2A] text-sm font-bold
                            text-white shadow-lg hover:scale-[1.03] hover:shadow-2xl
                            hover:bg-gradient-to-r hover:from-[#4A2C2A]
                            hover:via-[#8B5E3C] hover:to-[#C08B5C]
                            transition-all duration-300
                        "
                    >
                        <MdKeyboardArrowLeft size={18} />
                        Kembali
                    </button>

                    <div className="mb-10">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative w-16 h-16 rounded-3xl bg-[#FDF5E6] flex items-center justify-center shadow-sm">
                                <ShoppingCart size={30} className="text-[#8B5E3C]" />

                                {totalQty > 0 && (
                                    <span className="absolute -top-2 -right-2 min-w-[28px] h-[28px] px-2 rounded-full bg-[#4A2C2A] text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-lg">
                                        {totalQty}
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                    Keranjang Saya
                                </h1>
                                <p className="text-[#6B4E4C] mt-3 font-medium">
                                    Cek kembali produk pilihanmu sebelum checkout.
                                </p>
                            </div>
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-sm border border-[#EBD9C1] text-center">
                            <div className="w-20 h-20 bg-[#FDF5E6] text-[#8B5E3C] rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <ShoppingCart size={38} />
                            </div>

                            <h2 className="text-2xl md:text-3xl font-black">
                                Keranjang masih kosong
                            </h2>

                            <p className="text-slate-500 mt-3 font-medium">
                                Yuk pilih kue favoritmu terlebih dahulu.
                            </p>

                            <button
                                onClick={() => navigate("/customer/products")}
                                className="mt-8 px-10 py-4 bg-[#4A2C2A] text-white rounded-full font-black hover:bg-[#8B5E3C] transition-all shadow-lg"
                            >
                                Belanja Sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-5">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-[2rem] p-5 md:p-6 border border-[#EBD9C1]/70 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out"
                                    >
                                        <div className="flex flex-col md:flex-row gap-5">
                                            <img
                                                src={item.products?.image_url}
                                                alt={item.products?.name}
                                                className="w-full md:w-32 h-40 md:h-32 object-cover rounded-[1.5rem] bg-[#FDF5E6]"
                                            />

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xl font-black leading-tight">
                                                        {item.products?.name}
                                                    </h3>

                                                    <p className="text-[#8B5E3C] font-black mt-2">
                                                        {formatRupiah(item.products?.price || 0)}
                                                    </p>

                                                    {isCustomItem(item) && (
                                                        <div className="mt-4 rounded-2xl bg-[#FFFBF5] border border-[#EBD9C1] p-4">
                                                            <div className="flex items-center justify-between gap-3 mb-3">
                                                                <p className="text-sm font-black text-[#4A2C2A]">
                                                                    Request Custom Cake
                                                                </p>

                                                                <button
                                                                    onClick={() => openEditRequest(item)}
                                                                    className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#4A2C2A] text-white text-xs font-black hover:bg-[#8B5E3C]"
                                                                >
                                                                    <Edit3 size={13} />
                                                                    Edit
                                                                </button>
                                                            </div>

                                                            {item.reference_image_url && (
                                                                <img
                                                                    src={item.reference_image_url}
                                                                    alt="Foto referensi"
                                                                    onClick={() => setPreviewImage(item.reference_image_url)}
                                                                    className="w-28 h-28 rounded-2xl object-cover border border-[#EBD9C1] mb-3 cursor-pointer hover:scale-105 transition-all duration-300"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = "none";
                                                                    }}
                                                                />
                                                            )}

                                                            {item.custom_note && (
                                                                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                                                                    {item.custom_note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() =>
                                                                updateQty(item.id, item.qty, "minus")
                                                            }
                                                            className="w-10 h-10 rounded-full border-2 border-[#EBD9C1] flex items-center justify-center hover:bg-[#FDF5E6]"
                                                        >
                                                            <Minus size={16} />
                                                        </button>

                                                        <span className="w-8 text-center font-black">
                                                            {item.qty}
                                                        </span>

                                                        <button
                                                            onClick={() =>
                                                                updateQty(item.id, item.qty, "plus")
                                                            }
                                                            className="w-10 h-10 rounded-full border-2 border-[#EBD9C1] flex items-center justify-center hover:bg-[#FDF5E6]"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-5">
                                                        <p className="font-black text-[#4A2C2A]">
                                                            {formatRupiah(
                                                                Number(item.products?.price || 0) *
                                                                Number(item.qty || 0)
                                                            )}
                                                        </p>

                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-8 bg-white rounded-[2.5rem] p-7 shadow-xl border border-[#EBD9C1]/70">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="relative w-12 h-12 rounded-2xl bg-[#FDF5E6] text-[#8B5E3C] flex items-center justify-center">
                                            <ShoppingBag size={24} />

                                            {totalQty > 0 && (
                                                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-[#4A2C2A] text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-md">
                                                    {totalQty}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-xl font-black">Ringkasan</h2>
                                    </div>

                                    <div className="space-y-4 border-b border-[#EBD9C1] pb-5">
                                        <div className="flex justify-between text-sm font-bold text-slate-500">
                                            <span>Total Item</span>
                                            <span>{totalQty} item</span>
                                        </div>

                                        <div className="flex justify-between text-sm font-bold text-slate-500">
                                            <span>Subtotal</span>
                                            <span>{formatRupiah(totalPrice)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-6">
                                        <span className="text-lg font-black">Total</span>

                                        <span className="text-2xl font-black text-[#8B5E3C]">
                                            {formatRupiah(totalPrice)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => navigate("/customer/cart/checkout")}
                                        className="mt-8 w-full py-5 rounded-3xl bg-[#4A2C2A] text-white font-black text-lg hover:bg-[#8B5E3C] transition-all shadow-xl"
                                    >
                                        Checkout
                                    </button>

                                    <p className="mt-5 text-xs text-slate-400 font-bold text-center leading-relaxed">
                                        Pastikan jumlah produk sudah sesuai sebelum checkout.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-3xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-4 -right-4 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-[#4A2C2A] font-black"
                        >
                            <X size={22} />
                        </button>

                        <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl bg-white"
                        />
                    </div>
                </div>
            )}

            {editModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] border border-[#EBD9C1] shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EBD9C1]">
                            <div>
                                <p className="text-xs font-black text-[#8B5E3C] uppercase tracking-widest">
                                    Edit Request
                                </p>
                                <h2 className="text-2xl font-black text-[#4A2C2A]">
                                    Custom Cake
                                </h2>
                            </div>

                            <button
                                onClick={() => setEditModal(false)}
                                className="w-10 h-10 rounded-full bg-[#FDF5E6] text-[#4A2C2A] flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-black text-[#4A2C2A] mb-2">
                                    Foto Referensi
                                </label>

                                <label className="min-h-[180px] border-2 border-dashed border-[#EBD9C1] bg-[#FFFBF5] rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                                    {editPreview ? (
                                        <img
                                            src={editPreview}
                                            alt="Preview"
                                            className="w-full h-[210px] object-cover"
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

                                            setEditImage(file);
                                            setEditPreview(URL.createObjectURL(file));
                                        }}
                                    />
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#4A2C2A] mb-2">
                                    Catatan Desain
                                </label>

                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="Contoh: warna pink, tulisan Happy Birthday, tema bunga..."
                                    rows={4}
                                    className="w-full rounded-[1.5rem] border-2 border-[#EBD9C1] bg-[#FFFBF5] p-4 outline-none focus:border-[#8B5E3C] font-semibold text-[#4A2C2A] resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSaveRequest}
                                disabled={savingEdit}
                                className="w-full py-4 rounded-full bg-[#4A2C2A] text-white font-black hover:bg-gradient-to-r hover:from-[#4A2C2A] hover:via-[#8B5E3C] hover:to-[#C08B5C] transition-all duration-300 shadow-xl disabled:opacity-60"
                            >
                                {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CartPage;