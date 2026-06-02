import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        if (!userId) {
            setProfile(null);
            return null;
        }

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email, role, avatar_url, created_at")
                .eq("id", userId)
                .maybeSingle();

            if (error) throw error;

            const normalizedProfile = data
                ? {
                    ...data,
                    role: String(data.role || "customer")
                        .trim()
                        .toLowerCase(),
                }
                : null;

            setProfile(normalizedProfile);
            return normalizedProfile;
        } catch (error) {
            console.error("Fetch profile error:", error.message);
            setProfile(null);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                setLoading(true);

                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) throw error;
                if (!isMounted) return;

                if (session?.user) {
                    setUser(session.user);

                    // PENTING: tunggu profile selesai dulu
                    await fetchProfile(session.user.id);

                    if (isMounted) {
                        setLoading(false);
                    }
                } else {
                    setUser(null);
                    setProfile(null);

                    if (isMounted) {
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Init auth error:", error.message);

                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            }
        };

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;

            const handleSession = async () => {
                setLoading(true);

                if (session?.user) {
                    setUser(session.user);

                    // PENTING: tunggu profile selesai dulu
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }

                if (isMounted) {
                    setLoading(false);
                }
            };

            handleSession();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);

        const result = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (result.error) {
            setLoading(false);
            return result;
        }

        const loggedUser = result.data?.user;

        if (loggedUser) {
            setUser(loggedUser);
            await fetchProfile(loggedUser.id);
        }

        setLoading(false);
        return result;
    };

    const register = async ({ email, password, full_name }) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                },
            },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                login,
                register,
                logout,
                fetchProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
export const useAuth = () => useContext(AuthContext);