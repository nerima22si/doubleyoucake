import React from 'react';
import {
    History,
    Users,
    Heart,
    Star,
    ArrowLeft,
    ChevronDown,
    Award,
    Coffee
} from 'lucide-react';

const TentangKamiPage = () => {
    // Data Milestone Sejarah
    const milestones = [
        {
            year: "2018",
            title: "Awal Mula yang Manis",
            description: "Cake Double You dimulai dari dapur rumah kecil dengan resep keluarga rahasia yang mengutamakan kualitas bahan premium.",
            icon: <Heart className="text-[#8B5E3C]" />,
            image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&q=80&w=600"
        },
        {
            year: "2020",
            title: "Toko Pertama Kami",
            description: "Membuka outlet fisik pertama di pusat kota untuk melayani pelanggan yang ingin mencicipi langsung kelezatan kue kami.",
            icon: <Award className="text-[#8B5E3C]" />,
            image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"
        },
        {
            year: "2022",
            title: "Inovasi Custom Cake",
            description: "Meluncurkan layanan Custom Cake Artistik yang memungkinkan pelanggan mewujudkan desain impian mereka di atas kue.",
            icon: <Star className="text-[#8B5E3C]" />,
            image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=600"
        },
        {
            year: "2024",
            title: "Menjadi Favorit Kota",
            description: "Double You kini dikenal sebagai destinasi utama untuk hampers, ulang tahun, dan momen spesial dengan ribuan ulasan bintang lima.",
            icon: <Coffee className="text-[#8B5E3C]" />,
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600"
        }
    ];

    // Data Tim
    const teamMembers = [
        {
            name: "Chef Wendy",
            role: "Head Pastry Chef",
            image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&q=80&w=400",
            bio: "Ahli dalam teknik laminasi pastry dan dekorasi artistik."
        },
        {
            name: "Yasmine",
            role: "Creative Director",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
            bio: "Otak di balik konsep visual dan desain kustom kue Anda."
        },
        {
            name: "Chef Rendy",
            role: "Senior Baker",
            image: "https://images.unsplash.com/photo-1577214459173-9c8a5868f0bb?auto=format&fit=crop&q=80&w=400",
            bio: "Spesialis tekstur kue lembut dan pengembangan rasa baru."
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFBF5] text-[#4A2C2A] font-sans overflow-x-hidden">
            {/* HERO SECTION */}
            <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&q=80&w=1600"
                        className="w-full h-full object-cover opacity-20"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FFFBF5]/0 to-[#FFFBF5]"></div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in">
                   
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        Cerita <span className="text-[#8B5E3C]">Manis</span> Kami
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed italic">
                        "Double You hadir untuk memberikan kebahagiaan ganda di setiap gigitan, menyatukan rasa autentik dan seni visual yang memukau."
                    </p>
                    <div className="mt-12 animate-bounce">
                        <ChevronDown size={32} className="text-[#8B5E3C]/40 mx-auto" />
                    </div>
                </div>
            </div>

            {/* MILESTONE SEJARAH (VERTICAL TIMELINE) */}
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-20">
                    <div className="inline-block bg-[#EBD9C1] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        Timeline
                    </div>
                    <h2 className="text-4xl font-black">Perjalanan Kami</h2>
                </div>

                <div className="relative">
                    {/* Garis Tengah Timeline */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#EBD9C1]/40 hidden md:block"></div>

                    <div className="space-y-24">
                        {milestones.map((item, index) => (
                            <div key={index} className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                {/* Sisi Gambar */}
                                <div className="w-full md:w-1/2">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-[#8B5E3C] rounded-[2.5rem] rotate-3 group-hover:rotate-6 transition-transform duration-500 opacity-20"></div>
                                        <img
                                            src={item.image}
                                            className="relative w-full h-80 object-cover rounded-[2.5rem] shadow-xl z-10 transform group-hover:scale-[1.02] transition-all duration-500"
                                            alt={item.title}
                                        />
                                    </div>
                                </div>

                                {/* Titik Tengah */}
                                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white border-4 border-[#8B5E3C] rounded-full hidden md:flex items-center justify-center z-20 shadow-lg">
                                    {item.icon}
                                </div>

                                {/* Sisi Teks */}
                                <div className={`w-full md:w-1/2 text-center ${index % 2 !== 0 ? 'md:text-right' : 'md:text-left'}`}>
                                    <span className="text-4xl font-black text-[#8B5E3C]/20">{item.year}</span>
                                    <h3 className="text-2xl font-black mt-2 mb-4 text-[#4A2C2A]">{item.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed italic">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TEAM SECTION */}
            <div className="bg-[#4A2C2A] py-24 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black">Orang Dibalik Layar</h2>
                        <p className="text-[#EBD9C1] mt-4 font-medium italic opacity-80">Seniman rasa yang berdedikasi tinggi</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {teamMembers.map((person, index) => (
                            <div key={index} className="group text-center">
                                <div className="relative w-48 h-48 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-[#8B5E3C] rounded-[3rem] rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                                    <img
                                        src={person.image}
                                        className="relative w-full h-full object-cover rounded-[3rem] z-10 grayscale group-hover:grayscale-0 transition-all duration-500"
                                        alt={person.name}
                                    />
                                </div>
                                <h4 className="text-2xl font-black text-[#EBD9C1]">{person.name}</h4>
                                <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">{person.role}</p>
                                <p className="text-xs text-white/40 italic px-8 leading-relaxed">{person.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FILOSOFI SECTION */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="bg-white rounded-[4rem] p-12 md:p-20 shadow-sm border border-[#EBD9C1]/20 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <History size={48} className="text-[#8B5E3C] mb-6" />
                        <h2 className="text-4xl font-black mb-6">Filosofi <span className="text-[#8B5E3C]">Double You</span></h2>
                        <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                            Kami percaya bahwa setiap perayaan layak mendapatkan sentuhan personal. Nama **Double You** bukan hanya tentang dua huruf, tapi tentang memberikan nilai lebih (*Double*) bagi **Anda** (*You*).
                            <br /><br />
                            Kami berkomitmen untuk hanya menggunakan cokelat Belgia terbaik, vanilla asli dari petani lokal, dan mentega premium untuk memastikan setiap suapan adalah kenangan yang tak terlupakan.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FFFBF5] rounded-xl flex items-center justify-center text-[#8B5E3C]">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                                <span className="font-black text-sm uppercase">100% Cinta</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#FFFBF5] rounded-xl flex items-center justify-center text-[#8B5E3C]">
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <span className="font-black text-sm uppercase">Kualitas Premium</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="aspect-square rounded-[3.5rem] overflow-hidden rotate-2 shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1556910110-a5a63dfd393c?auto=format&fit=crop&q=80&w=800"
                                className="w-full h-full object-cover"
                                alt="Dapur Kami"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* CALL TO ACTION */}
            <div className="max-w-3xl mx-auto text-center px-6 py-20 border-t border-[#EBD9C1]/40">
                <h3 className="text-3xl font-black mb-8 italic">"Manisnya momen Anda adalah kebanggaan kami."</h3>
                <button
                    onClick={() => window.location.hash = "KATALOG"}
                    className="bg-[#8B5E3C] text-white px-12 py-5 rounded-2xl font-black shadow-2xl hover:bg-[#4A2C2A] transition-all hover:scale-105 active:scale-95"
                >
                    Lihat Koleksi Kue Kami
                </button>
            </div>
        </div>
    );
};

export default TentangKamiPage;