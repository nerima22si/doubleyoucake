import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Send,
    ArrowLeft,
    ImagePlus,
    X,
    MessageCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
    formatChatTime,
    formatChatDate,
    isSameChatDay,
} from "../../../utils/timeFormatter";

const BUCKET_NAME = "chat-images";

const AdminChatRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        initAdminRoom();

        return () => {
            setAdminOnline(false);
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        const channel = supabase
            .channel(`admin-room-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chat_messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setMessages((prev) => {
                            const exists = prev.some(
                                (msg) => msg.id === payload.new.id
                            );

                            if (exists) return prev;

                            return [...prev, payload.new];
                        });

                        if (payload.new.sender_role === "customer") {
                            markCustomerMessagesAsRead();
                        }
                    }

                    if (payload.eventType === "UPDATE") {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.new.id
                                    ? payload.new
                                    : msg
                            )
                        );
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "chat_rooms",
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    setRoom(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    const initAdminRoom = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);

            const roomData = await fetchRoom();
            await fetchMessages();
            await setAdminOnline(true);
            await markCustomerMessagesAsRead();

            if (roomData?.customer_id) {
                await fetchCustomer(roomData.customer_id);
            }
        } catch (error) {
            console.error("Init admin room error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoom = async () => {
        const { data, error } = await supabase
            .from("chat_rooms")
            .select("*")
            .eq("id", roomId)
            .single();

        if (error) {
            console.error("Fetch room error:", error.message);
            return null;
        }

        setRoom(data);
        return data;
    };

    const fetchCustomer = async (customerId) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, full_name, email, avatar_url")
            .eq("id", customerId)
            .maybeSingle();

        if (error) {
            console.error("Fetch customer error:", error.message);
            return;
        }

        setCustomer(data);
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Fetch messages error:", error.message);
            return;
        }

        setMessages(data || []);
    };

    const setAdminOnline = async (status) => {
        if (!roomId) return;

        await supabase
            .from("chat_rooms")
            .update({
                admin_online: status,
                last_admin_seen: new Date().toISOString(),
            })
            .eq("id", roomId);
    };

    const markCustomerMessagesAsRead = async () => {
        await supabase
            .from("chat_messages")
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq("room_id", roomId)
            .eq("sender_role", "customer")
            .eq("is_read", false);
    };

    const getCustomerName = () => {
        if (customer?.full_name?.trim()) return customer.full_name;

        const firstName = customer?.first_name?.trim() || "";
        const lastName = customer?.last_name?.trim() || "";
        const combinedName = `${firstName} ${lastName}`.trim();

        if (combinedName) return combinedName;
        if (customer?.email) return customer.email;

        return "Customer";
    };

    const getInitial = () => {
        return getCustomerName().charAt(0).toUpperCase();
    };

    const handleSelectImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeSelectedImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const uploadImage = async () => {
        if (!imageFile || !user?.id) return null;

        const ext = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const sendMessage = async () => {
        if (!message.trim() && !imageFile) return;
        if (!roomId || !user?.id) return;
        if (sending) return;

        const text = message.trim();

        try {
            setSending(true);
            setMessage("");

            let imageUrl = null;

            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const { error } = await supabase.from("chat_messages").insert({
                room_id: roomId,
                sender_id: user.id,
                sender_role: "admin",
                message: text || null,
                image_url: imageUrl,
                is_read: false,
                read_at: null,
            });

            if (error) throw error;

            removeSelectedImage();
        } catch (error) {
            console.error("Send admin message error:", error.message);
            setMessage(text);
        } finally {
            setSending(false);
        }
    };

    const formatDateDivider = (date) => {
        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(today.getDate() - 1);

        if (isSameChatDay(date, today)) return "Hari ini";
        if (isSameChatDay(date, yesterday)) return "Kemarin";

        return formatChatDate(date);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                    <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />
                    <div className="text-center">
                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Memuat Room Chat...
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
        <div className="w-full min-h-[calc(100vh-120px)] bg-[#FFFBF5] rounded-[2rem] overflow-hidden border border-[#EBD9C1]">
            <div className="px-6 py-5 bg-[#4A2C2A] text-white flex items-center gap-4 shrink-0">
                <button
                    onClick={() => navigate("/admin/chat")}
                    className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center overflow-hidden">
                    {customer?.avatar_url ? (
                        <img
                            src={customer.avatar_url}
                            alt={getCustomerName()}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xl font-black">
                            {getInitial()}
                        </span>
                    )}
                </div>

                <div>
                    <h1 className="text-xl font-black">
                        {getCustomerName()}
                    </h1>
                    <p className="text-sm text-white/80">
                        {room?.order_id
                            ? `Order #${room.order_id}`
                            : "Belum ada order terkait"}
                    </p>
                </div>
            </div>

            <div className="h-[calc(100vh-290px)] overflow-y-auto bg-[#FFFBF5] p-5 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <MessageCircle
                                size={42}
                                className="mx-auto text-slate-300 mb-3"
                            />
                            <p className="text-slate-400 font-semibold">
                                Belum ada pesan dari customer.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isAdmin = msg.sender_role === "admin";

                        const showDateDivider =
                            index === 0 ||
                            !isSameChatDay(
                                msg.created_at,
                                messages[index - 1].created_at
                            );

                        return (
                            <div key={msg.id}>
                                {showDateDivider && (
                                    <div className="flex justify-center my-4">
                                        <span className="px-4 py-2 rounded-full bg-white border border-[#EBD9C1] text-xs font-black text-slate-400 shadow-sm">
                                            {formatDateDivider(
                                                msg.created_at
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`flex ${isAdmin
                                            ? "justify-end"
                                            : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-3 rounded-3xl shadow-sm transition-all duration-300 ${isAdmin
                                                ? "bg-[#4A2C2A] text-white rounded-br-md"
                                                : "bg-white text-[#4A2C2A] border border-[#EBD9C1] rounded-bl-md"
                                            }`}
                                    >
                                        {msg.image_url && (
                                            <img
                                                src={msg.image_url}
                                                alt="Chat"
                                                className="mb-3 max-h-72 rounded-2xl object-cover"
                                            />
                                        )}

                                        {msg.message && (
                                            <p className="font-semibold leading-relaxed">
                                                {msg.message}
                                            </p>
                                        )}

                                        <div
                                            className={`text-[11px] mt-2 flex items-center gap-1 ${isAdmin
                                                    ? "text-white/60 justify-end"
                                                    : "text-slate-400 justify-start"
                                                }`}
                                        >
                                            <span>
                                                {formatChatTime(
                                                    msg.created_at
                                                )}
                                            </span>

                                            {isAdmin && (
                                                <span>
                                                    {msg.is_read
                                                        ? "✓✓ Dibaca"
                                                        : "✓ Terkirim"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={bottomRef} />
            </div>

            {imagePreview && (
                <div className="px-5 py-3 bg-white border-t border-[#EBD9C1]">
                    <div className="relative w-28 h-28">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-28 h-28 object-cover rounded-2xl border border-[#EBD9C1]"
                        />

                        <button
                            onClick={removeSelectedImage}
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="p-5 bg-white border-t border-[#EBD9C1] shrink-0">
                <div className="flex items-center gap-3">
                    <label className="w-14 h-14 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] text-[#4A2C2A] flex items-center justify-center cursor-pointer hover:bg-[#FDF5E6] transition-all">
                        <ImagePlus size={22} />

                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleSelectImage}
                        />
                    </label>

                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        placeholder="Balas pesan..."
                        className="flex-1 px-5 py-4 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] outline-none focus:border-[#8B5E3C] font-semibold text-[#4A2C2A]"
                    />

                    <button
                        onClick={sendMessage}
                        disabled={sending || (!message.trim() && !imageFile)}
                        className="w-14 h-14 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center hover:bg-[#8B5E3C] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminChatRoom;