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
                            const updatedMessages = (room.chat_messages || []).map(
                                (msg) => (msg.id === payload.new.id ? payload.new : msg)
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
                    (roomData || []).map((room) => room.customer_id).filter(Boolean)
                ),
            ];

            let profilesMap = {};

            if (customerIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, first_name, last_name, full_name, email, avatar_url")
                    .in("id", customerIds);

                if (!profilesError) {
                    profilesMap = (profilesData || []).reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {});
                }
            }

            const formattedRooms = (roomData || []).map((room) => {
                const messages = room.chat_messages || [];
                const lastMessage = getLatestMessage(messages);

                const unreadCount = messages.filter(
                    (msg) => msg.sender_role === "customer" && !msg.is_read
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
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
                <div className="bg-white border border-[#EBD9C1] rounded-[1.5rem] sm:rounded-[2rem] px-6 sm:px-10 py-8 sm:py-12 flex flex-col items-center gap-4 sm:gap-5 shadow-xl">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-[4px] sm:border-[5px] border-[#EBD9C1] border-t-[#4A2C2A] animate-spin" />

                    <div className="text-center">
                        <h2 className="text-base sm:text-xl font-black text-[#4A2C2A]">
                            Memuat Daftar Chat...
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-[#6B4E4C] mt-1">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-120px)] bg-[#FFFBF5] rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border border-[#EBD9C1]">
            <div className="bg-[#4A2C2A] text-white px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                        <MessageCircle size={22} className="sm:w-6 sm:h-6 lg:w-[30px] lg:h-[30px]" />

                        {totalUnreadMessages > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1 sm:px-2 rounded-full bg-red-500 text-white text-[10px] sm:text-xs font-black flex items-center justify-center border-2 border-[#4A2C2A] shadow-lg">
                                {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-black truncate">
                            Chat Customer
                        </h1>

                        <p className="text-xs sm:text-sm lg:text-base text-white/70 font-semibold mt-1 truncate">
                            {totalUnreadRooms > 0
                                ? `${totalUnreadRooms} chat belum dibaca`
                                : "Daftar chat dari customer"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-3 sm:p-5 lg:p-6">
                <div className="mb-3 sm:mb-4 bg-white border border-[#EBD9C1] rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-sm">
                    <Search size={18} className="text-slate-400 shrink-0 sm:w-5 sm:h-5" />

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama customer, order, atau pesan..."
                        className="w-full outline-none bg-transparent font-semibold text-[#4A2C2A] placeholder:text-slate-400 text-xs sm:text-sm lg:text-base"
                    />
                </div>

                <div className="mb-4 sm:mb-6 w-full overflow-x-auto pb-1">
                    <div className="flex gap-2 min-w-max">
                        {FILTERS.map((item) => {
                            const active = filter === item.value;

                            return (
                                <button
                                    key={item.value}
                                    onClick={() => setFilter(item.value)}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-sm font-black border transition-all duration-200 whitespace-nowrap ${active
                                            ? "bg-[#4A2C2A] text-white border-[#4A2C2A] shadow-md"
                                            : "bg-white text-[#4A2C2A] border-[#EBD9C1] hover:bg-[#FDF5E6]"
                                        }`}
                                >
                                    {item.value === "unread" && (
                                        <Inbox size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    )}
                                    {item.value === "read" && (
                                        <MailOpen size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    )}

                                    <span>{item.label}</span>

                                    {item.value === "unread" &&
                                        totalUnreadMessages > 0 && (
                                            <span
                                                className={`min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] px-1 rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center ${active
                                                        ? "bg-white text-[#4A2C2A]"
                                                        : "bg-red-500 text-white"
                                                    }`}
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
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {filteredRooms.length === 0 ? (
                        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-[#EBD9C1] p-6 sm:p-10 text-center shadow-sm">
                            <p className="font-bold text-slate-400 text-xs sm:text-sm lg:text-base">
                                Tidak ada chat pada filter ini.
                            </p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => navigate(`/admin/chat/${room.id}`)}
                                className={`w-full bg-white border rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] p-3 sm:p-4 lg:p-5 flex items-center justify-between gap-3 hover:shadow-xl hover:scale-[1.005] transition-all duration-300 ease-in-out ${room.unreadCount > 0
                                        ? "border-[#4A2C2A] shadow-md"
                                        : "border-[#EBD9C1]"
                                    }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div className="relative w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-[#FDF5E6] border-2 border-[#EBD9C1] text-[#4A2C2A] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        {room.customer?.avatar_url ? (
                                            <img
                                                src={room.customer.avatar_url}
                                                alt={getCustomerName(room)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-base sm:text-xl lg:text-2xl font-black">
                                                {getCustomerName(room)
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <h2
                                                className={`text-sm sm:text-base lg:text-lg text-[#4A2C2A] truncate ${room.unreadCount > 0
                                                        ? "font-black"
                                                        : "font-bold"
                                                    }`}
                                            >
                                                {getCustomerName(room)}
                                            </h2>

                                            <span className="hidden sm:inline text-[#8B5E3C] font-black">
                                                •
                                            </span>

                                            <span className="text-[10px] sm:text-xs lg:text-sm font-black text-[#8B5E3C] truncate">
                                                {room.order_id
                                                    ? `Order #${room.order_id}`
                                                    : "Belum ada order"}
                                            </span>

                                            {room.unreadCount > 0 && (
                                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-50 text-red-600 text-[10px] sm:text-xs font-black">
                                                    Pesan Baru
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={`text-xs sm:text-sm mt-1 truncate max-w-[180px] sm:max-w-[350px] md:max-w-[520px] lg:max-w-[700px] ${room.unreadCount > 0
                                                    ? "text-[#4A2C2A] font-black"
                                                    : "text-slate-500 font-semibold"
                                                }`}
                                        >
                                            {getLastMessageText(room)}
                                        </p>

                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 font-semibold truncate">
                                            {room.lastMessage
                                                ? formatDate(room.lastMessage.created_at)
                                                : formatDate(room.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                    {room.unreadCount > 0 && (
                                        <span className="min-w-[24px] sm:min-w-[28px] h-[24px] sm:h-[28px] px-1.5 sm:px-2 rounded-full bg-[#4A2C2A] text-white text-[10px] sm:text-xs font-black flex items-center justify-center shadow-md">
                                            {room.unreadCount > 99
                                                ? "99+"
                                                : room.unreadCount}
                                        </span>
                                    )}

                                    <ChevronRight
                                        size={18}
                                        className="text-[#4A2C2A] sm:w-5 sm:h-5"
                                    />
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