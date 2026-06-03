import { useEffect, useRef, useState } from "react";
import { X, Send, ImagePlus, MessageCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { formatChatTime } from "../../../utils/timeFormatter";

const BUCKET_NAME = "chat-images";

export default function AdminChatPopup({
    open,
    onClose,
    customerId,
    orderId,
    customerName,
}) {
    const [user, setUser] = useState(null);
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef(null);

    useEffect(() => {
        if (!open || !customerId) return;
        initRoom();
    }, [open, customerId]);

    useEffect(() => {
        if (!room?.id) return;

        const channel = supabase
            .channel(`popup-chat-${room.id}`)
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
                            const exists = prev.some(
                                (msg) => msg.id === payload.new.id
                            );

                            if (exists) return prev;

                            return [...prev, payload.new];
                        });

                        if (payload.new.sender_role === "customer") {
                            markCustomerMessagesAsRead(room.id);
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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    const initRoom = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        const { data: existingRooms } = await supabase
            .from("chat_rooms")
            .select("*")
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .limit(1);

        let currentRoom = existingRooms?.[0];

        if (!currentRoom) {
            const { data: newRoom, error } = await supabase
                .from("chat_rooms")
                .insert({
                    customer_id: customerId,
                    order_id: orderId || null,
                    admin_id: user?.id || null,
                    admin_online: true,
                    last_admin_seen: new Date().toISOString(),
                })
                .select("*")
                .single();

            if (error) {
                console.error("Create chat room error:", error.message);
                return;
            }

            currentRoom = newRoom;
        } else {
            await supabase
                .from("chat_rooms")
                .update({
                    order_id: currentRoom.order_id || orderId || null,
                    admin_id: user?.id || currentRoom.admin_id,
                    admin_online: true,
                    last_admin_seen: new Date().toISOString(),
                })
                .eq("id", currentRoom.id);
        }

        setRoom(currentRoom);
        fetchMessages(currentRoom.id);
        markCustomerMessagesAsRead(currentRoom.id);
    };

    const fetchMessages = async (roomId) => {
        const { data, error } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        if (!error) {
            setMessages(data || []);
        }
    };

    const markCustomerMessagesAsRead = async (roomId) => {
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

    const uploadImage = async () => {
        if (!imageFile || !user?.id) return null;

        const ext = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, imageFile);

        if (error) throw error;

        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const sendMessage = async () => {
        if (!message.trim() && !imageFile) return;
        if (!room?.id || !user?.id || sending) return;

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
                sender_role: "admin",
                message: text || null,
                image_url: imageUrl,
                is_read: false,
                read_at: null,
            });

            if (error) throw error;

            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Send popup chat error:", error.message);
            setMessage(text);
        } finally {
            setSending(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-3xl h-[92vh] sm:h-[86vh] lg:h-[80vh] bg-white rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl border border-[#EBD9C1] flex flex-col">
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 bg-[#4A2C2A] text-white flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <MessageCircle size={18} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
                        </div>

                        <div className="min-w-0">
                            <h2 className="font-black text-sm sm:text-base md:text-lg truncate">
                                {customerName || "Customer"}
                            </h2>

                            <p className="text-xs sm:text-sm text-white/70 truncate">
                                {orderId ? `Order #${orderId}` : "Chat customer"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#FFFBF5] p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold text-xs sm:text-sm md:text-base text-center px-4">
                            Belum ada pesan.
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isAdmin = msg.sender_role === "admin";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl shadow-sm text-xs sm:text-sm md:text-base ${isAdmin
                                                ? "bg-[#4A2C2A] text-white rounded-br-md"
                                                : "bg-white text-[#4A2C2A] border border-[#EBD9C1] rounded-bl-md"
                                            }`}
                                    >
                                        {msg.image_url && (
                                            <img
                                                src={msg.image_url}
                                                alt="Chat"
                                                className="mb-2 sm:mb-3 max-h-40 sm:max-h-56 md:max-h-64 rounded-xl sm:rounded-2xl object-cover"
                                            />
                                        )}

                                        {msg.message && (
                                            <p className="font-semibold leading-relaxed break-words">
                                                {msg.message}
                                            </p>
                                        )}

                                        <p className="text-[9px] sm:text-[10px] md:text-[11px] mt-1.5 sm:mt-2 opacity-70 text-right">
                                            {formatChatTime(msg.created_at)}

                                            {isAdmin && (
                                                <span className="ml-1">
                                                    {msg.is_read
                                                        ? "✓✓ Dibaca"
                                                        : "✓ Terkirim"}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <div ref={bottomRef} />
                </div>

                {imagePreview && (
                    <div className="px-3 sm:px-4 md:px-5 py-3 bg-white border-t border-[#EBD9C1]">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-xl sm:rounded-2xl border border-[#EBD9C1]"
                            />

                            <button
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center"
                            >
                                <X size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-3 sm:p-4 md:p-5 bg-white border-t border-[#EBD9C1] flex items-center gap-2 sm:gap-3 shrink-0">
                    <label className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] flex items-center justify-center cursor-pointer shrink-0">
                        <ImagePlus size={18} className="sm:w-5 sm:h-5" />

                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                            }}
                        />
                    </label>

                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                        }}
                        placeholder="Tulis pesan..."
                        className="flex-1 min-w-0 px-3 sm:px-4 md:px-5 py-3 rounded-full bg-[#FFFBF5] border-2 border-[#EBD9C1] outline-none font-semibold text-xs sm:text-sm md:text-base"
                    />

                    <button
                        onClick={sendMessage}
                        disabled={sending || (!message.trim() && !imageFile)}
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#4A2C2A] text-white flex items-center justify-center disabled:opacity-50 shrink-0"
                    >
                        <Send size={17} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                </div>
            </div>
        </div>
    );
}