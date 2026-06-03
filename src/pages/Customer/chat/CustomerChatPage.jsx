import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ImagePlus, X } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
    formatChatTime,
    formatChatDate,
    isSameChatDay,
} from "../../../utils/timeFormatter";

const BUCKET_NAME = "chat-images";

const CustomerChatPage = () => {
    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        initChat();
    }, []);

    useEffect(() => {
        if (!room?.id) return;

        fetchMessages(room.id);
        markAdminMessagesAsRead(room.id);

        const channel = supabase
            .channel(`customer-chat-${room.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chat_messages",
                    filter: `room_id=eq.${room.id}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setMessages((prev) => {
                            const exists = prev.some((msg) => msg.id === payload.new.id);
                            if (exists) return prev;
                            return [...prev, payload.new];
                        });

                        if (payload.new.sender_role === "admin") {
                            markAdminMessagesAsRead(room.id);
                        }
                    }

                    if (payload.eventType === "UPDATE") {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === payload.new.id ? payload.new : msg
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
                    filter: `id=eq.${room.id}`,
                },
                (payload) => {
                    setRoom(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const initChat = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                setLoading(false);
                return;
            }

            setUser(user);

            const { data: existingRooms, error: roomError } = await supabase
                .from("chat_rooms")
                .select("*")
                .eq("customer_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);

            if (roomError) throw roomError;

            const existingRoom = existingRooms?.[0] || null;

            if (existingRoom) {
                setRoom(existingRoom);
                return;
            }

            let latestOrderId = null;

            const { data: latestOrder } = await supabase
                .from("orders")
                .select("id")
                .eq("customer_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestOrder?.id) {
                latestOrderId = latestOrder.id;
            }

            const { data: newRoom, error: createRoomError } = await supabase
                .from("chat_rooms")
                .insert({
                    customer_id: user.id,
                    order_id: latestOrderId,
                })
                .select("*")
                .single();

            if (createRoomError) throw createRoomError;

            setRoom(newRoom);
        } catch (error) {
            console.error("Init chat error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (roomId) => {
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

    const markAdminMessagesAsRead = async (roomId) => {
        const { error } = await supabase
            .from("chat_messages")
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq("room_id", roomId)
            .eq("sender_role", "admin")
            .eq("is_read", false);

        if (error) {
            console.error("Mark admin messages read error:", error.message);
        }
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

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

        return data.publicUrl;
    };

    const sendMessage = async () => {
        if (!message.trim() && !imageFile) return;
        if (!room?.id || !user?.id) return;
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
                room_id: room.id,
                sender_id: user.id,
                sender_role: "customer",
                message: text || null,
                image_url: imageUrl,
                is_read: false,
                read_at: null,
            });

            if (error) throw error;

            removeSelectedImage();
        } catch (error) {
            console.error("Send message error:", error.message);
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
            <div className="w-full min-h-[calc(100vh-100px)] bg-[#FFFBF5] flex items-center justify-center px-4">
                <div className="bg-white border border-[#EBD9C1] rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-10 py-6 sm:py-8 shadow-xl text-center">
                    <p className="font-black text-[#4A2C2A] text-sm sm:text-base">
                        Memuat chat...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-100px)]">
            <div className="w-full h-[calc(100vh-130px)] sm:h-[calc(100vh-150px)] lg:h-[calc(100vh-170px)] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border border-[#EBD9C1] shadow-xl overflow-hidden flex flex-col">
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 bg-[#4A2C2A] text-white flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <MessageCircle size={20} className="sm:w-[22px] sm:h-[22px] md:w-6 md:h-6" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg md:text-xl font-black truncate">
                            Chat Admin
                        </h1>

                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                            <span
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${room?.admin_online ? "bg-green-400" : "bg-gray-400"
                                    }`}
                            />

                            <span className="truncate">
                                {room?.admin_online
                                    ? "Admin sedang online"
                                    : "Admin sedang offline"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#FFFBF5] p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center px-4">
                            <p className="text-slate-400 font-semibold text-xs sm:text-sm md:text-base">
                                Belum ada pesan. Mulai chat dengan admin.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMe = msg.sender_id === user?.id;

                            const showDateDivider =
                                index === 0 ||
                                !isSameChatDay(
                                    msg.created_at,
                                    messages[index - 1].created_at
                                );

                            return (
                                <div key={msg.id}>
                                    {showDateDivider && (
                                        <div className="flex justify-center my-3 sm:my-4">
                                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-[#EBD9C1] text-[10px] sm:text-xs font-black text-slate-400 shadow-sm">
                                                {formatDateDivider(msg.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl shadow-sm transition-all duration-300 text-xs sm:text-sm md:text-base ${isMe
                                                    ? "bg-[#4A2C2A] text-white rounded-br-md"
                                                    : "bg-white text-[#4A2C2A] border border-[#EBD9C1] rounded-bl-md"
                                                }`}
                                        >
                                            {msg.image_url && (
                                                <img
                                                    src={msg.image_url}
                                                    alt="Chat"
                                                    className="mb-2 sm:mb-3 max-h-44 sm:max-h-60 md:max-h-72 rounded-xl sm:rounded-2xl object-cover"
                                                />
                                            )}

                                            {msg.message && (
                                                <p className="font-semibold leading-relaxed break-words">
                                                    {msg.message}
                                                </p>
                                            )}

                                            <div
                                                className={`text-[9px] sm:text-[10px] md:text-[11px] mt-1.5 sm:mt-2 flex items-center gap-1 ${isMe
                                                        ? "text-white/60 justify-end"
                                                        : "text-slate-400 justify-start"
                                                    }`}
                                            >
                                                <span>{formatChatTime(msg.created_at)}</span>

                                                {isMe && (
                                                    <span>
                                                        {msg.is_read ? "✓✓ Dibaca" : "✓ Terkirim"}
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
                    <div className="px-3 sm:px-4 md:px-5 py-3 bg-white border-t border-[#EBD9C1]">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-xl sm:rounded-2xl border border-[#EBD9C1]"
                            />

                            <button
                                onClick={removeSelectedImage}
                                className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center"
                            >
                                <X size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-3 sm:p-4 md:p-5 bg-white border-t border-[#EBD9C1] shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <label className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] text-[#4A2C2A] flex items-center justify-center cursor-pointer hover:bg-[#FDF5E6] transition-all shrink-0">
                            <ImagePlus size={18} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />

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
                            placeholder="Tulis pesan..."
                            className="flex-1 min-w-0 px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] outline-none focus:border-[#8B5E3C] font-semibold text-[#4A2C2A] text-xs sm:text-sm md:text-base"
                        />

                        <button
                            onClick={sendMessage}
                            disabled={sending || (!message.trim() && !imageFile)}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center hover:bg-[#8B5E3C] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <Send size={17} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerChatPage;