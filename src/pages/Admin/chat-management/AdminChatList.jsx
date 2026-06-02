import { useEffect, useState } from "react";
import {
    MessageCircle,
    ChevronRight,
    Search,
    Inbox,
    MailOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { formatChatDateTime } from "../../../utils/timeFormatter";

const FILTERS = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Read", value: "read" },
];

const AdminChatList = () => {
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchRooms();

        const channel = supabase
            .channel("admin-chat-list")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    setRooms((prev) => {
                        const updatedRooms = prev.map((room) => {
                            if (room.id !== payload.new.room_id) return room;

                            const exists = (room.chat_messages || []).some(
                                (msg) => msg.id === payload.new.id
                            );

                            const newMessages = exists
                                ? room.chat_messages || []
                                : [...(room.chat_messages || []), payload.new];

                            const unreadCount = newMessages.filter(
                                (msg) =>
                                    msg.sender_role === "customer" &&
                                    !msg.is_read
                            ).length;

                            return {
                                ...room,
                                chat_messages: newMessages,
                                lastMessage: payload.new,
                                unreadCount,
                            };
                        });

                        return sortRooms(updatedRooms);
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    setRooms((prev) => {
                        const updatedRooms = prev.map((room) => {
                            const updatedMessages = (
                                room.chat_messages || []
                            ).map((msg) =>
                                msg.id === payload.new.id ? payload.new : msg
                            );

                            const lastMessage = getLatestMessage(updatedMessages);

                            const unreadCount = updatedMessages.filter(
                                (msg) =>
                                    msg.sender_role === "customer" &&
                                    !msg.is_read
                            ).length;

                            return {
                                ...room,
                                chat_messages: updatedMessages,
                                lastMessage,
                                unreadCount,
                            };
                        });

                        return sortRooms(updatedRooms);
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chat_rooms",
                },
                () => {
                    fetchRooms(false);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getLatestMessage = (messages = []) => {
        return (
            [...messages].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0] || null
        );
    };

    const sortRooms = (roomList) => {
        return [...roomList].sort((a, b) => {
            const dateA = a.lastMessage?.created_at || a.created_at;
            const dateB = b.lastMessage?.created_at || b.created_at;
            return new Date(dateB) - new Date(dateA);
        });
    };

    const fetchRooms = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const { data: roomData, error: roomError } = await supabase
                .from("chat_rooms")
                .select(`
                    id,
                    customer_id,
                    admin_id,
                    order_id,
                    admin_online,
                    last_admin_seen,
                    created_at,
                    chat_messages (
                        id,
                        room_id,
                        message,
                        image_url,
                        created_at,
                        sender_role,
                        is_read
                    )
                `)
                .order("created_at", { ascending: false });

            if (roomError) throw roomError;

            const customerIds = [
                ...new Set(
                    (roomData || [])
                        .map((room) => room.customer_id)
                        .filter(Boolean)
                ),
            ];

            let profilesMap = {};

            if (customerIds.length > 0) {
                const { data: profilesData, error: profilesError } =
                    await supabase
                        .from("profiles")
                        .select(
                            "id, first_name, last_name, full_name, email, avatar_url"
                        )
                        .in("id", customerIds);

                if (!profilesError) {
                    profilesMap = (profilesData || []).reduce(
                        (acc, profile) => {
                            acc[profile.id] = profile;
                            return acc;
                        },
                        {}
                    );
                }
            }

            const formattedRooms = (roomData || []).map((room) => {
                const messages = room.chat_messages || [];
                const lastMessage = getLatestMessage(messages);

                const unreadCount = messages.filter(
                    (msg) =>
                        msg.sender_role === "customer" &&
                        !msg.is_read
                ).length;

                return {
                    ...room,
                    customer: profilesMap[room.customer_id] || null,
                    lastMessage,
                    unreadCount,
                };
            });

            setRooms(sortRooms(formattedRooms));
        } catch (error) {
            console.error("Fetch admin chat rooms error:", error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "";
        return formatChatDateTime(date);
    };

    const getLastMessageText = (room) => {
        if (!room.lastMessage) return "Belum ada pesan";
        if (room.lastMessage.message) return room.lastMessage.message;
        if (room.lastMessage.image_url) return "Mengirim gambar";
        return "Belum ada pesan";
    };

    const getCustomerName = (room) => {
        const profile = room.customer;

        if (profile?.full_name?.trim()) return profile.full_name;

        const firstName = profile?.first_name?.trim() || "";
        const lastName = profile?.last_name?.trim() || "";
        const combinedName = `${firstName} ${lastName}`.trim();

        if (combinedName) return combinedName;
        if (profile?.email) return profile.email;

        return "Customer";
    };

    const totalUnreadRooms = rooms.filter((room) => room.unreadCount > 0).length;
    const totalUnreadMessages = rooms.reduce(
        (total, room) => total + Number(room.unreadCount || 0),
        0
    );

    const filteredRooms = rooms.filter((room) => {
        const keyword = search.toLowerCase();
        const name = getCustomerName(room).toLowerCase();
        const order = room.order_id ? `order #${room.order_id}` : "";
        const message = getLastMessageText(room).toLowerCase();

        const matchSearch =
            name.includes(keyword) ||
            order.toLowerCase().includes(keyword) ||
            message.includes(keyword);

        const matchFilter =
            filter === "all" ||
            (filter === "unread" && room.unreadCount > 0) ||
            (filter === "read" && room.unreadCount === 0);

        return matchSearch && matchFilter;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-6">
                <div className="bg-white border border-[#EBD9C1] rounded-[2rem] px-10 py-12 flex flex-col items-center gap-5 shadow-xl">
                    <div className="w-16 h-16 rounded-full border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />
                    <div className="text-center">
                        <h2 className="text-xl font-black text-[#4A2C2A]">
                            Memuat Daftar Chat...
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
            <div className="bg-[#4A2C2A] text-white px-8 py-7">
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                        <MessageCircle size={30} />

                        {totalUnreadMessages > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-2 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center border-2 border-[#4A2C2A] shadow-lg">
                                {totalUnreadMessages > 99
                                    ? "99+"
                                    : totalUnreadMessages}
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-black">
                            Chat Customer
                        </h1>
                        <p className="text-white/70 font-semibold mt-1">
                            {totalUnreadRooms > 0
                                ? `${totalUnreadRooms} chat belum dibaca`
                                : "Daftar chat dari customer"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-4 bg-white border border-[#EBD9C1] rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
                    <Search size={20} className="text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama customer, order, atau pesan..."
                        className="w-full outline-none bg-transparent font-semibold text-[#4A2C2A] placeholder:text-slate-400"
                    />
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {FILTERS.map((item) => {
                        const active = filter === item.value;

                        return (
                            <button
                                key={item.value}
                                onClick={() => setFilter(item.value)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black border transition-all duration-200
                                    ${active
                                        ? "bg-[#4A2C2A] text-white border-[#4A2C2A] shadow-md"
                                        : "bg-white text-[#4A2C2A] border-[#EBD9C1] hover:bg-[#FDF5E6]"
                                    }
                                `}
                            >
                                {item.value === "unread" && <Inbox size={15} />}
                                {item.value === "read" && <MailOpen size={15} />}

                                <span>{item.label}</span>

                                {item.value === "unread" &&
                                    totalUnreadMessages > 0 && (
                                        <span
                                            className={`
                                                min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center
                                                ${active
                                                    ? "bg-white text-[#4A2C2A]"
                                                    : "bg-red-500 text-white"
                                                }
                                            `}
                                        >
                                            {totalUnreadMessages > 99
                                                ? "99+"
                                                : totalUnreadMessages}
                                        </span>
                                    )}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    {filteredRooms.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-[#EBD9C1] p-10 text-center shadow-sm">
                            <p className="font-bold text-slate-400">
                                Tidak ada chat pada filter ini.
                            </p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() =>
                                    navigate(`/admin/chat/${room.id}`)
                                }
                                className={`
                                    w-full bg-white border
                                    rounded-[2rem] p-5 flex items-center justify-between
                                    hover:shadow-xl hover:scale-[1.005]
                                    transition-all duration-300 ease-in-out
                                    ${room.unreadCount > 0
                                        ? "border-[#4A2C2A] shadow-md"
                                        : "border-[#EBD9C1]"
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative w-16 h-16 rounded-full bg-[#FDF5E6] border-2 border-[#EBD9C1] text-[#4A2C2A] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        {room.customer?.avatar_url ? (
                                            <img
                                                src={room.customer.avatar_url}
                                                alt={getCustomerName(room)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-black">
                                                {getCustomerName(room)
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2
                                                className={`text-lg text-[#4A2C2A] ${room.unreadCount > 0
                                                        ? "font-black"
                                                        : "font-bold"
                                                    }`}
                                            >
                                                {getCustomerName(room)}
                                            </h2>

                                            <span className="text-[#8B5E3C] font-black">
                                                •
                                            </span>

                                            <span className="text-sm font-black text-[#8B5E3C]">
                                                {room.order_id
                                                    ? `Order #${room.order_id}`
                                                    : "Belum ada order"}
                                            </span>

                                            {room.unreadCount > 0 && (
                                                <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black">
                                                    Pesan Baru
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={`text-sm mt-1 truncate max-w-[700px] ${room.unreadCount > 0
                                                    ? "text-[#4A2C2A] font-black"
                                                    : "text-slate-500 font-semibold"
                                                }`}
                                        >
                                            {getLastMessageText(room)}
                                        </p>

                                        <p className="text-xs text-slate-400 mt-2 font-semibold">
                                            {room.lastMessage
                                                ? formatDate(
                                                    room.lastMessage
                                                        .created_at
                                                )
                                                : formatDate(room.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {room.unreadCount > 0 && (
                                        <span className="min-w-[28px] h-[28px] px-2 rounded-full bg-[#4A2C2A] text-white text-xs font-black flex items-center justify-center shadow-md">
                                            {room.unreadCount > 99
                                                ? "99+"
                                                : room.unreadCount}
                                        </span>
                                    )}

                                    <ChevronRight className="text-[#4A2C2A]" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatList;